import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Download, ImagePlus, Loader2, RefreshCcw, Ticket, UserRound } from 'lucide-react';
import heroImage from './assets/hero.png';
import { generateBuilderCard, generatePfpFrame, sanitiseFileName } from './utils/canvasGenerator';
import { ensureBrowserFriendlyImage } from './utils/heicConverter';
import {
  ImageProcessingError,
  MAX_FILE_SIZE_BYTES,
  isSupportedFile,
  normaliseImage,
} from './utils/imageProcessor';
import { generateTitle } from './utils/titleGenerator';

type PreviewMode = 'pfp' | 'pass';

const DEFAULT_ROLE = 'Python · Deep Learning · AI/ML';
const DEFAULT_TITLE = 'Applied AI Builder';

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function App() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [fileName, setFileName] = useState('Nothing uploaded');
  const [name, setName] = useState('');
  const [role, setRole] = useState(DEFAULT_ROLE);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [funFact, setFunFact] = useState('');
  const [mode, setMode] = useState<PreviewMode>('pfp');
  const [pfpBlob, setPfpBlob] = useState<Blob | null>(null);
  const [passBlob, setPassBlob] = useState<Blob | null>(null);
  const [pfpUrl, setPfpUrl] = useState('');
  const [passUrl, setPassUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const displayName = name.trim() || 'Your Name';
  const activeUrl = mode === 'pfp' ? pfpUrl : passUrl;
  const activeBlob = mode === 'pfp' ? pfpBlob : passBlob;
  const filenameBase = useMemo(() => sanitiseFileName(displayName), [displayName]);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      if (pfpUrl) URL.revokeObjectURL(pfpUrl);
      if (passUrl) URL.revokeObjectURL(passUrl);
    };
  }, [imageUrl, pfpUrl, passUrl]);

  useEffect(() => {
    if (!image) return;

    let cancelled = false;
    const sourceImage = image;
    async function renderPreviews() {
      setBusy(true);
      setError('');
      try {
        const [nextPfp, nextPass] = await Promise.all([
          generatePfpFrame(sourceImage),
          generateBuilderCard({
            image: sourceImage,
            name: displayName,
            role,
            title,
            funFact,
          }),
        ]);

        if (cancelled) return;

        if (pfpUrl) URL.revokeObjectURL(pfpUrl);
        if (passUrl) URL.revokeObjectURL(passUrl);
        setPfpBlob(nextPfp);
        setPassBlob(nextPass);
        setPfpUrl(URL.createObjectURL(nextPfp));
        setPassUrl(URL.createObjectURL(nextPass));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not generate your frame.');
      } finally {
        if (!cancelled) setBusy(false);
      }
    }

    renderPreviews();
    return () => {
      cancelled = true;
    };
  }, [image, displayName, role, title, funFact]);

  async function handleFile(file?: File) {
    if (!file) return;
    setError('');

    if (!isSupportedFile(file)) {
      setError('Upload a JPG, PNG, WEBP, HEIC, or HEIF image.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('That photo is over 30 MB. Try a smaller export.');
      return;
    }

    setBusy(true);
    try {
      const friendlyFile = await ensureBrowserFriendlyImage(file);
      const result = await normaliseImage(friendlyFile);
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      setImage(result.image);
      setImageUrl(result.objectUrl);
      setFileName(file.name.replace(/\.[^/.]+$/, '') || 'Photo ready');
    } catch (err) {
      if (err instanceof ImageProcessingError || err instanceof Error) setError(err.message);
      else setError('Could not read this image.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    handleFile(event.target.files?.[0]);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  }

  function regenerateTitle() {
    setTitle((current) => generateTitle(role, current));
  }

  function downloadActive() {
    if (!activeBlob) return;
    const suffix = mode === 'pfp' ? 'pfp-frame' : 'builder-id';
    downloadBlob(activeBlob, `${filenameBase}-${suffix}.png`);
  }

  return (
    <main className="page">
      <header className="site-header">
        <div className="studio-mark">2:47PM<br />STUDIO</div>
        <nav>
          <a href="https://hhgoa.com">HHGOA.COM</a>
          <button type="button">247 Seats · Apply</button>
        </nav>
      </header>

      <section className="hero">
        <div>
          <div className="event-lockup">
            <span>Hacker House</span>
            <b>Goa</b>
          </div>
          <p className="event-meta">Goa, India · 28-31 Oct <mark>2026</mark></p>
          <h1>one photo.<br />one frame.<br />everything in place.</h1>
          <p className="hero-copy">
            Drop in a picture and take out an HH Goa 2026 profile frame or a builder ID with your name and stack.
          </p>
        </div>
        <img src={heroImage} alt="Goa coastline illustration" />
      </section>

      <section className="maker" aria-label="Frame maker">
        <div className="preview-column">
          <div className="mode-tabs" aria-label="Preview type">
            <button className={mode === 'pfp' ? 'active' : ''} type="button" onClick={() => setMode('pfp')}>
              <UserRound size={17} />
              PFP Frame
            </button>
            <button className={mode === 'pass' ? 'active' : ''} type="button" onClick={() => setMode('pass')}>
              <Ticket size={17} />
              Builder ID
            </button>
          </div>

          <div className={`preview-stage ${mode === 'pass' ? 'is-pass' : ''}`}>
            {busy ? (
              <div className="empty-state">
                <Loader2 className="spin" size={30} />
                <span>Rendering</span>
              </div>
            ) : activeUrl ? (
              <img src={activeUrl} alt={`${mode === 'pfp' ? 'PFP frame' : 'Builder ID'} preview`} />
            ) : (
              <div className="frame-placeholder">
                <div className="placeholder-ring">
                  <span>Your Photo</span>
                </div>
                <b>Hacker House Goa 2026</b>
              </div>
            )}
          </div>
          <p className="preview-note">Tap upload, or drop a photo anywhere on the control panel.</p>
        </div>

        <aside className="controls">
          <div className="section-kicker">Upload</div>
          <h2>Photo</h2>
          <label
            className={`upload-button ${isDragging ? 'is-dragging' : ''}`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
          >
            <input ref={inputRef} type="file" accept="image/*,.heic,.heif" onChange={onInputChange} />
            <ImagePlus size={18} />
            Upload
          </label>
          <p className="fine-print">{fileName} · JPG, PNG, WEBP, HEIC</p>

          <div className="section-kicker">Builder Details</div>
          <div className="field-stack">
            <label>
              <span>Name</span>
              <input value={name} maxLength={32} placeholder="Your name" onChange={(event) => setName(event.target.value)} />
            </label>
            <label>
              <span>Stack / Role</span>
              <input value={role} maxLength={46} onChange={(event) => setRole(event.target.value)} />
            </label>
            <label>
              <span>Builder Class</span>
              <div className="inline-control">
                <input value={title} maxLength={38} onChange={(event) => setTitle(event.target.value)} />
                <button type="button" onClick={regenerateTitle} aria-label="Regenerate builder class">
                  <RefreshCcw size={18} />
                </button>
              </div>
            </label>
            <label>
              <span>Footer Line</span>
              <input
                value={funFact}
                maxLength={60}
                placeholder="@yourhandle"
                onChange={(event) => setFunFact(event.target.value)}
              />
            </label>
          </div>

          {error ? <p className="error-message">{error}</p> : null}

          <button className="download-button" type="button" onClick={downloadActive} disabled={!activeBlob || busy}>
            <Download size={18} />
            Download {mode === 'pfp' ? 'PFP' : 'Builder ID'}
          </button>
        </aside>
      </section>

      <div className="ticker">
        <span>2:47 PM Studio</span>
        <span>Goa, India</span>
        <span>28-31 Oct 2026</span>
        <span>247 Seats</span>
        <span>#FrameInGoa</span>
        <span>Less noise. More signal.</span>
      </div>
    </main>
  );
}

export default App;
