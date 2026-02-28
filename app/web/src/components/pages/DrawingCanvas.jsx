import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Brush, Eraser, Undo, Redo, Save, Trash2, Sparkles, PanelRightOpen, X } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FloatingReferenceWindow from '@/components/FloatingReferenceWindow.jsx';
import { getGhostOverlayFromAI } from '@/components/AICorrector.js';

const QUICK_COLORS = ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080'];

const DrawingCanvas = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusMode = searchParams.get('focus') === '1';

  const canvasRef = useRef(null);
  const suggestCanvasRef = useRef(null);
  const wrapRef = useRef(null);
  const rafRef = useRef(null);
  const strokeRef = useRef({ drawing: false, pointerId: null, last: null, next: null });
  const aiTimerRef = useRef(null);
  const pinchRef = useRef({ startDist: 0, startScale: 1 });

  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('brush');
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  const [showReferenceWindow, setShowReferenceWindow] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiOpacity, setAiOpacity] = useState(35);
  const [aiBusy, setAiBusy] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  const [viewScale, setViewScale] = useState(1);

  const [isLive, setIsLive] = useState(false);

  const [artworkData, setArtworkData] = useState({
    title: '',
    description: '',
  });

  const clearSuggest = () => {
    const sc = suggestCanvasRef.current;
    if (!sc) return;
    const sctx = sc.getContext('2d');
    sctx.clearRect(0, 0, sc.width, sc.height);
  };

  const fillBackground = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d', { desynchronized: true });
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, c.width, c.height);
  };

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(canvas.toDataURL());
    const limited = newHistory.slice(-30);
    setHistory(limited);
    setHistoryStep(limited.length - 1);
  };

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const suggest = suggestCanvasRef.current;
    if (!wrap || !canvas || !suggest) return;

    const init = () => {
      const { clientWidth, clientHeight } = wrap;
      const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
      const w = Math.max(1, Math.floor(clientWidth * dpr));
      const h = Math.max(1, Math.floor(clientHeight * dpr));

      const snapshot = historyStep >= 0 ? history[historyStep] : null;

      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${clientWidth}px`;
      canvas.style.height = `${clientHeight}px`;

      suggest.width = w;
      suggest.height = h;
      suggest.style.width = `${clientWidth}px`;
      suggest.style.height = `${clientHeight}px`;

      fillBackground();
      clearSuggest();

      if (snapshot) {
        const img = new Image();
        img.src = snapshot;
        img.onload = () => {
          const ctx = canvas.getContext('2d', { desynchronized: true });
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          if (aiEnabled) generateAiOverlay();
        };
      } else {
        saveToHistory();
      }
    };

    init();
    const ro = new ResizeObserver(() => init());
    ro.observe(wrap);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPoint = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const dpr = canvas.width / rect.width;
    return {
      x: (e.clientX - rect.left) * dpr,
      y: (e.clientY - rect.top) * dpr,
      p: typeof e.pressure === 'number' ? e.pressure : 0.5,
    };
  };

  const strokeStep = () => {
    rafRef.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { desynchronized: true });
    const s = strokeRef.current;
    if (!s.drawing || !s.last || !s.next) return;

    const lp = s.last;
    const np = s.next;
    const pressure = np.p > 0 ? np.p : 0.5;
    const width = tool === 'eraser' ? brushSize * 2 : brushSize * (0.6 + pressure * 0.7);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = width;

    if (tool === 'brush') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = brushColor;
    } else {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    }

    ctx.beginPath();
    ctx.moveTo(lp.x, lp.y);
    const mx = (lp.x + np.x) / 2;
    const my = (lp.y + np.y) / 2;
    ctx.quadraticCurveTo(lp.x, lp.y, mx, my);
    ctx.stroke();

    s.last = np;
  };

  const scheduleStroke = () => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(strokeStep);
  };

  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const canvas = canvasRef.current;
    canvas.setPointerCapture?.(e.pointerId);
    const pt = getPoint(e);
    strokeRef.current = { drawing: true, pointerId: e.pointerId, last: pt, next: pt };
    setIsDrawing(true);
    scheduleStroke();
  };

  const onPointerMove = (e) => {
    const s = strokeRef.current;
    if (!s.drawing || (s.pointerId != null && s.pointerId !== e.pointerId)) return;
    s.next = getPoint(e);
    scheduleStroke();
  };

  const onPointerUp = () => {
    const s = strokeRef.current;
    if (!s.drawing) return;
    s.drawing = false;
    s.pointerId = null;
    s.last = null;
    s.next = null;
    setIsDrawing(false);
    saveToHistory();
    if (aiEnabled) {
      window.clearTimeout(aiTimerRef.current);
      aiTimerRef.current = window.setTimeout(() => generateAiOverlay(), 350);
    }
  };

  // TouchEvents wrapper (some browsers/webviews still rely on touch handlers)
  const touchToLikePointer = (touch, pointerId = 1) => ({
    clientX: touch.clientX,
    clientY: touch.clientY,
    pressure: typeof touch.force === 'number' && touch.force > 0 ? touch.force : 0.5,
    pointerId,
    button: 0,
  });

  const onTouchStart = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const [t1, t2] = [e.touches[0], e.touches[1]];
      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;
      const dist = Math.hypot(dx, dy) || 1;
      pinchRef.current = { startDist: dist, startScale: viewScale };
      setIsPinching(true);
      return;
    }

    if (e.touches.length === 1 && !isPinching) {
      e.preventDefault();
      const t = e.touches[0];
      onPointerDown(touchToLikePointer(t));
    }
  };

  const onTouchMove = (e) => {
    if (isPinching && e.touches.length === 2) {
      e.preventDefault();
      const [t1, t2] = [e.touches[0], e.touches[1]];
      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;
      const dist = Math.hypot(dx, dy) || 1;
      const { startDist, startScale } = pinchRef.current;
      const rawScale = startScale * (dist / startDist);
      const clamped = Math.min(3, Math.max(0.7, rawScale));
      setViewScale(clamped);
      return;
    }

    if (!isPinching && e.touches.length === 1) {
      e.preventDefault();
      const t = e.touches[0];
      onPointerMove(touchToLikePointer(t));
    }
  };

  const onTouchEnd = (e) => {
    if (isPinching && e.touches.length < 2) {
      setIsPinching(false);
      return;
    }
    if (!isPinching) {
      e.preventDefault();
      onPointerUp();
    }
  };

  const undo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = history[historyStep - 1];
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        if (aiEnabled) generateAiOverlay();
      };
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = history[historyStep + 1];
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        if (aiEnabled) generateAiOverlay();
      };
    }
  };

  const clearCanvas = () => {
    if (!window.confirm('Are you sure you want to clear the canvas?')) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
    clearSuggest();
  };

  const handleSave = async () => {
    if (!artworkData.title) {
      toast({
        title: 'Error',
        description: 'Please enter a title for your artwork',
        variant: 'destructive',
      });
      return;
    }

    try {
      const canvas = canvasRef.current;
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      
      const formData = new FormData();
      formData.append('title', artworkData.title);
      formData.append('description', artworkData.description);
      formData.append('image', blob, 'artwork.png');
      formData.append('creator_id', currentUser.id);
      formData.append('likes_count', 0);
      formData.append('comments_count', 0);
      formData.append('views', 0);

      const record = await pb.collection('artworks').create(formData, { $autoCancel: false });

      toast({
        title: 'Success',
        description: 'Artwork saved successfully!',
      });

      setSaveDialogOpen(false);
      navigate(`/artwork/${record.id}`);
    } catch (error) {
      console.error('Error saving artwork:', error);
      toast({
        title: 'Error',
        description: 'Failed to save artwork',
        variant: 'destructive',
      });
    }
  };

  const generateAiOverlay = async () => {
    const base = canvasRef.current;
    const out = suggestCanvasRef.current;
    if (!base || !out) return;
    setAiBusy(true);

    try {
      // Prefer real AI API if configured
      const ai = await getGhostOverlayFromAI(base);
      if (ai?.type === 'image' && ai.imageUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = ai.imageUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        const octx = out.getContext('2d');
        octx.clearRect(0, 0, out.width, out.height);
        octx.globalCompositeOperation = 'source-over';
        octx.globalAlpha = aiOpacity / 100;
        octx.imageSmoothingEnabled = true;
        octx.drawImage(img, 0, 0, out.width, out.height);
        octx.globalAlpha = 1;
        return;
      }

      const w = base.width;
      const h = base.height;
      const smallW = Math.max(160, Math.floor(w / 4));
      const smallH = Math.max(160, Math.floor(h / 4));

      const tmp = document.createElement('canvas');
      tmp.width = smallW;
      tmp.height = smallH;
      const tctx = tmp.getContext('2d', { willReadFrequently: true });
      tctx.drawImage(base, 0, 0, smallW, smallH);
      const img = tctx.getImageData(0, 0, smallW, smallH);
      const data = img.data;

      const g = new Float32Array(smallW * smallH);
      for (let i = 0, j = 0; i < data.length; i += 4, j++) {
        g[j] = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
      }

      const edge = new Uint8ClampedArray(smallW * smallH);
      const thr = 0.22;
      for (let y = 1; y < smallH - 1; y++) {
        for (let x = 1; x < smallW - 1; x++) {
          const i = y * smallW + x;
          const gx =
            -g[i - smallW - 1] - 2 * g[i - 1] - g[i + smallW - 1] +
            g[i - smallW + 1] + 2 * g[i + 1] + g[i + smallW + 1];
          const gy =
            -g[i - smallW - 1] - 2 * g[i - smallW] - g[i - smallW + 1] +
            g[i + smallW - 1] + 2 * g[i + smallW] + g[i + smallW + 1];
          const mag = Math.min(1, Math.sqrt(gx * gx + gy * gy));
          edge[i] = mag > thr ? Math.floor(255 * Math.min(1, (mag - thr) * 3.2)) : 0;
        }
      }

      const eimg = tctx.createImageData(smallW, smallH);
      for (let i = 0; i < edge.length; i++) {
        const v = edge[i];
        const o = i * 4;
        eimg.data[o] = 80;
        eimg.data[o + 1] = 230;
        eimg.data[o + 2] = 255;
        eimg.data[o + 3] = v;
      }
      tctx.clearRect(0, 0, smallW, smallH);
      tctx.putImageData(eimg, 0, 0);

      const octx = out.getContext('2d');
      octx.clearRect(0, 0, w, h);
      octx.globalCompositeOperation = 'source-over';
      octx.globalAlpha = aiOpacity / 100;
      octx.imageSmoothingEnabled = true;
      octx.drawImage(tmp, 0, 0, w, h);
      octx.globalAlpha = 1;
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Drawing Canvas - AnimeSense</title>
        <meta name="description" content="Create digital artwork with professional drawing tools" />
      </Helmet>

      <div className="min-h-screen bg-gray-950">
        {!focusMode && <Header />}

        <div className={focusMode ? 'flex h-[100vh]' : 'flex h-[calc(100vh-4rem)]'}>
          {/* Toolbar */}
          {!focusMode && (
            <div className="w-20 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-6 space-y-4">
              <Button
                variant={tool === 'brush' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setTool('brush')}
                className={tool === 'brush' ? 'bg-cyan-500 hover:bg-cyan-600' : 'text-gray-400 hover:text-white hover:bg-gray-800'}
              >
                <Brush className="w-5 h-5" />
              </Button>

              <Button
                variant={tool === 'eraser' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setTool('eraser')}
                className={tool === 'eraser' ? 'bg-cyan-500 hover:bg-cyan-600' : 'text-gray-400 hover:text-white hover:bg-gray-800'}
              >
                <Eraser className="w-5 h-5" />
              </Button>

              <div className="border-t border-gray-800 w-full my-2"></div>

              <Button
                variant="ghost"
                size="icon"
                onClick={undo}
                disabled={historyStep <= 0}
                className="text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30"
              >
                <Undo className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={redo}
                disabled={historyStep >= history.length - 1}
                className="text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30"
              >
                <Redo className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={clearCanvas}
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <Trash2 className="w-5 h-5" />
              </Button>

              <div className="border-t border-gray-800 w-full my-2"></div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSaveDialogOpen(true)}
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <Save className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Canvas Area */}
          <div className={focusMode ? 'flex-1 relative bg-gray-950' : 'flex-1 flex items-center justify-center bg-gray-950 p-4 md:p-8 relative'}>
            <div
              ref={wrapRef}
              className={focusMode ? 'absolute inset-0' : 'relative w-full max-w-5xl aspect-[4/3]'}
              style={{ transform: `scale(${viewScale})`, transformOrigin: 'center center' }}
            >
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onTouchCancel={onTouchEnd}
                onContextMenu={(e) => e.preventDefault()}
                className={focusMode ? 'w-full h-full touch-none' : 'w-full h-full border-2 border-gray-800 rounded-lg shadow-2xl touch-none'}
              />
              <canvas
                ref={suggestCanvasRef}
                width={800}
                height={600}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ opacity: aiEnabled ? 1 : 0 }}
              />
            </div>

            {/* Focus Mode: floating controls */}
            {focusMode && (
              <div className="absolute right-4 bottom-4 z-40 flex flex-col gap-2">
                <Button
                  size="icon"
                  className="h-12 w-12 bg-gray-900/80 border border-gray-700 text-white hover:bg-gray-800"
                  onClick={() => setShowReferenceWindow((s) => !s)}
                  title="Toggle reference window"
                >
                  <PanelRightOpen className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  className={aiEnabled ? 'h-12 w-12 bg-cyan-500 text-white hover:bg-cyan-600' : 'h-12 w-12 bg-gray-900/80 border border-gray-700 text-white hover:bg-gray-800'}
                  onClick={() => {
                    const next = !aiEnabled;
                    setAiEnabled(next);
                    if (next) generateAiOverlay();
                    else clearSuggest();
                  }}
                  title="AI Suggest overlay"
                >
                  <Sparkles className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  className="h-12 w-12 bg-gray-900/80 border border-gray-700 text-white hover:bg-gray-800"
                  onClick={() => navigate('/dashboard')}
                  title="Exit focus mode"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            )}

            {focusMode && showReferenceWindow && (
              <FloatingReferenceWindow onClose={() => setShowReferenceWindow(false)} />
            )}

            {aiEnabled && (
              <div className={focusMode ? 'absolute left-4 bottom-4 z-40 w-60 rounded-xl bg-gray-950/70 border border-gray-800 p-3 backdrop-blur' : 'absolute left-4 top-4 z-30 w-60 rounded-xl bg-gray-950/60 border border-gray-800 p-3 backdrop-blur'}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-300">AI opacity</span>
                  <span className="text-xs text-cyan-300">{aiOpacity}%{aiBusy ? '…' : ''}</span>
                </div>
                <Slider
                  value={[aiOpacity]}
                  onValueChange={(v) => setAiOpacity(v[0])}
                  onValueCommit={() => aiEnabled && generateAiOverlay()}
                  min={10}
                  max={70}
                  step={1}
                />
                {!focusMode && (
                  <Button
                    className="w-full mt-3 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white"
                    onClick={generateAiOverlay}
                    disabled={aiBusy}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {aiBusy ? 'Analyzing…' : 'Regenerate AI Suggest'}
                  </Button>
                )}
              </div>
            )}

            {isLive && (
              <div className="absolute top-4 right-4 z-40 flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/90 border border-red-400 shadow-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-red-200 animate-pulse" />
                <span className="text-xs font-semibold text-white tracking-wide">LIVE</span>
              </div>
            )}
          </div>

          {/* Properties Panel */}
          {!focusMode && (
            <div className="w-80 bg-gray-900 border-l border-gray-800 p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Tool Properties</h3>

                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300 mb-2 block">Brush Size: {brushSize}px</Label>
                    <Slider
                      value={[brushSize]}
                      onValueChange={(value) => setBrushSize(value[0])}
                      min={1}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {tool === 'brush' && (
                    <div>
                      <Label className="text-gray-300 mb-2 block">Brush Color</Label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={brushColor}
                          onChange={(e) => setBrushColor(e.target.value)}
                          className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-700"
                        />
                        <Input
                          type="text"
                          value={brushColor}
                          onChange={(e) => setBrushColor(e.target.value)}
                          className="flex-1 bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-800 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Colors</h3>
                <div className="grid grid-cols-5 gap-2">
                  {QUICK_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setBrushColor(color)}
                      className="w-10 h-10 rounded-lg border-2 border-gray-700 hover:border-cyan-500 transition-colors"
                      style={{ backgroundColor: color }}
                      type="button"
                    />
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-800 pt-6">
                <h3 className="text-lg font-semibold text-white mb-3">AI Suggest Layer</h3>
                <Button
                  onClick={() => {
                    const next = !aiEnabled;
                    setAiEnabled(next);
                    if (next) generateAiOverlay();
                    else clearSuggest();
                  }}
                  className={aiEnabled ? 'w-full bg-cyan-500 hover:bg-cyan-600 text-white' : 'w-full bg-gray-800 hover:bg-gray-700 text-white'}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {aiEnabled ? 'Disable AI Suggest' : 'Enable AI Suggest'}
                </Button>
                <p className="text-gray-400 text-xs mt-2">
                  Generates ghost-line overlays from your sketch to help spot anatomy/perspective issues.
                </p>
              </div>

              <div className="border-t border-gray-800 pt-6">
                <h3 className="text-lg font-semibold text-white mb-3">Live</h3>
                <Button
                  onClick={() => setIsLive((v) => !v)}
                  className={isLive ? 'w-full bg-red-600 hover:bg-red-700 text-white' : 'w-full bg-gray-800 hover:bg-gray-700 text-white'}
                >
                  {isLive ? 'Stop Streaming' : 'Start Streaming'}
                </Button>
                <p className="text-gray-400 text-xs mt-2">
                  Toggles a live-status indicator so followers know when you are actively working.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Save Dialog */}
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>Save Artwork</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={artworkData.title}
                  onChange={(e) => setArtworkData({ ...artworkData, title: e.target.value })}
                  placeholder="Enter artwork title"
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={artworkData.description}
                  onChange={(e) => setArtworkData({ ...artworkData, description: e.target.value })}
                  placeholder="Describe your artwork"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <Button 
                onClick={handleSave}
                className="w-full bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white"
              >
                Save Artwork
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default DrawingCanvas;