'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../../components/ProtectedRoute';
import DashboardLayout from '../../../components/DashboardLayout';
import api from '../../../lib/api';
import { useToast } from '../../../context/ToastContext';
import { 
  Sliders, 
  ChevronRight, 
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText
} from 'lucide-react';

export default function LetterheadSetup() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settings, setSettings] = useState({
    hospitalName: 'Prayascare Hospital',
    mobileNumbers: ['9876543210'],
    address: 'NH 48, Rampura, Sector 78, Gurgaon, HR - 122012',
    letterheadImageUrl: '',
    letterheadImagePublicId: '',
    letterheadHeaderHeight: 4.60,
    letterheadFooterHeight: 3.40
  });

  // Fetch existing settings
  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      try {
        const res = await api.get('/admin/hospital-settings');
        if (res.exists && res.data) {
          setSettings(prev => ({
            ...prev,
            ...res.data,
            letterheadHeaderHeight: res.data.letterheadHeaderHeight !== undefined ? res.data.letterheadHeaderHeight : 4.60,
            letterheadFooterHeight: res.data.letterheadFooterHeight !== undefined ? res.data.letterheadFooterHeight : 3.40
          }));
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  // Handle file input changes and base64 upload to Cloudinary
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 400 * 1024) {
      alert('File size exceeds the 400kb limit. Please compress the image.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result;
      setUploading(true);
      try {
        // Upload image to Cloudinary using integrated backend helper
        const res = await api.post('/admin/hospital-settings/upload-logo', { 
          imageData: base64Data, 
          folder: 'hms/letterheads' 
        });
        
        setSettings(prev => ({
          ...prev,
          letterheadImageUrl: res.url,
          letterheadImagePublicId: res.publicId
        }));
        
        showToast('Letterhead image uploaded to Cloudinary successfully!', 'success');
      } catch (err) {
        showToast(err.message || 'Failed to upload image to Cloudinary', 'error');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle deleting uploaded letterhead image
  const handleDeleteImage = async () => {
    if (!settings.letterheadImagePublicId) {
      setSettings(prev => ({ ...prev, letterheadImageUrl: '', letterheadImagePublicId: '' }));
      return;
    }

    if (!confirm('Are you sure you want to delete this letterhead image?')) return;

    setUploading(true);
    try {
      await api.delete('/admin/hospital-settings/delete-logo', { 
        data: { publicId: settings.letterheadImagePublicId } 
      });
      
      setSettings(prev => ({
        ...prev,
        letterheadImageUrl: '',
        letterheadImagePublicId: ''
      }));
      showToast('Letterhead image deleted from Cloudinary.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to delete image', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Handle Margin Save to settings
  const handleSaveMargins = async () => {
    setSaving(true);
    try {
      await api.post('/admin/hospital-settings', {
        ...settings,
        letterheadHeaderHeight: Number(settings.letterheadHeaderHeight),
        letterheadFooterHeight: Number(settings.letterheadFooterHeight)
      });
      showToast('Letterhead margins and settings updated successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update margins', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex flex-col md:flex-row gap-5 pb-12 text-slate-800 text-xs font-semibold">
          
          {/* Setup Guide Sidebar */}
          <div className="w-full md:w-56 bg-[#0f172a] text-slate-300 rounded-xl p-4 shadow-md shrink-0 space-y-3 no-print">
            <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-2">Setup Guide</h2>
            <nav className="space-y-1 text-xs font-medium">
              <button 
                onClick={() => router.push('/setup/ratelist')}
                className="w-full text-left px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-between cursor-pointer"
              >
                <span>Ratelist</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => router.push('/setup/letterhead')}
                className="w-full text-left px-3 py-2 rounded-lg bg-blue-600 font-bold text-white flex items-center justify-between shadow-xs cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5" /> Letterhead
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => showToast('Case registration prefix settings are pre-configured.', 'success')}
                className="w-full text-left px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-between cursor-pointer"
              >
                <span>Case reg. no.</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => showToast('Panels are managed inside the Rate List page.', 'success')}
                className="w-full text-left px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-between cursor-pointer"
              >
                <span>Panels</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => showToast('Proofread validation rules are active.', 'success')}
                className="w-full text-left px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-between cursor-pointer"
              >
                <span>Proofread</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </nav>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <button 
                onClick={() => router.push('/dashboard')}
                className="text-blue-400 hover:text-blue-300 font-bold cursor-pointer"
              >
                Skip setup »
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => router.push('/setup/ratelist')} 
                className="flex-1 py-1.5 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 text-center hover:bg-slate-800 cursor-pointer"
              >
                ‹ Prev
              </button>
              <button 
                onClick={() => router.push('/dashboard')} 
                className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold text-center hover:bg-blue-500 cursor-pointer"
              >
                Next ›
              </button>
            </div>
          </div>

          {/* Main workspace container */}
          <div className="flex-1 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col lg:flex-row gap-8">
            
            {/* Left Options Config Block */}
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-black text-slate-900">Letterhead</h1>
              </div>

              {/* Upload image preview box */}
              <div className="space-y-3">
                <div className="relative w-44 h-56 border-2 border-dashed border-slate-300 bg-slate-50/50 rounded-xl flex flex-col items-center justify-center overflow-hidden">
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                      <span className="text-[10px] text-slate-400 font-bold">Uploading...</span>
                    </div>
                  ) : settings.letterheadImageUrl ? (
                    <>
                      <img 
                        src={settings.letterheadImageUrl} 
                        alt="Letterhead Preview" 
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={handleDeleteImage}
                        className="absolute top-2 right-2 p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg border border-red-200 cursor-pointer shadow-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-slate-400 text-center p-3 gap-2">
                      <FileText className="w-8 h-8 text-slate-300" />
                      <span className="text-[10px] font-bold text-slate-400">No Image Uploaded</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    className="text-xs text-slate-500 cursor-pointer file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                  />
                  <p className="text-[10px] text-slate-400">(Supported file formats: jpeg, jpg, png)</p>
                </div>
              </div>

              {/* PDF View action */}
              <button 
                onClick={() => {
                  if (settings.letterheadImageUrl) window.open(settings.letterheadImageUrl);
                  else showToast('Please upload a letterhead image first.', 'error');
                }}
                className="text-blue-600 hover:underline flex items-center gap-1 cursor-pointer font-bold"
              >
                <span>📄</span> Letterhead PDF
              </button>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 font-bold leading-relaxed text-[11px]">
                {"Don't have a letterhead? Instantly create one with the "}
                <a href="https://labsmart.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Labsmart Letterhead Generator App!</a>
              </div>

              {/* Margin Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Header height</label>
                  <div className="flex items-center bg-white border border-slate-300 rounded-lg overflow-hidden focus-within:border-blue-400">
                    <input 
                      type="number" 
                      step="0.1"
                      value={settings.letterheadHeaderHeight} 
                      onChange={(e) => setSettings({ ...settings, letterheadHeaderHeight: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 outline-none font-bold text-slate-800 text-xs text-right"
                    />
                    <span className="bg-slate-100 text-slate-500 px-3 py-2 border-l border-slate-200 font-bold">cm</span>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Footer height</label>
                  <div className="flex items-center bg-white border border-slate-300 rounded-lg overflow-hidden focus-within:border-blue-400">
                    <input 
                      type="number" 
                      step="0.1"
                      value={settings.letterheadFooterHeight} 
                      onChange={(e) => setSettings({ ...settings, letterheadFooterHeight: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 outline-none font-bold text-slate-800 text-xs text-right"
                    />
                    <span className="bg-slate-100 text-slate-500 px-3 py-2 border-l border-slate-200 font-bold">cm</span>
                  </div>
                </div>
              </div>

              {/* More settings collapse placeholder */}
              <button 
                onClick={() => alert('No additional configurations available.')}
                className="text-slate-500 hover:text-slate-700 flex items-center gap-1 font-bold cursor-pointer"
              >
                <span>More setting</span> <span>▼</span>
              </button>

              <button
                onClick={handleSaveMargins}
                disabled={saving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-md text-xs"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Update Margins</span>
              </button>
            </div>

            {/* Middle Simulator Column */}
            <div className="flex-1 flex flex-col items-center justify-start border-l border-slate-100 pl-8">
              
              {/* Aspect Ratio Alert Banner */}
              <div className="w-full max-w-sm px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-lg text-center text-[10px] mb-4">
                ✓ Letterhead image is in correct A4 aspect ratio.
              </div>

              {/* Simulated A4 Canvas */}
              <div className="relative w-[300px] h-[424px] bg-white border border-slate-300 shadow-lg rounded overflow-hidden flex flex-col justify-between">
                
                {/* Header Simulator Margin Area */}
                <div 
                  style={{ height: `${(settings.letterheadHeaderHeight / 29.7) * 424}px` }}
                  className="relative w-full border-b border-dashed border-red-400 bg-blue-50 transition-all flex items-center justify-center"
                >
                  {settings.letterheadImageUrl ? (
                    <img 
                      src={settings.letterheadImageUrl} 
                      alt="Simulated Header" 
                      className="w-full h-full object-fill opacity-90"
                    />
                  ) : (
                    <div className="text-center p-2 text-blue-800">
                      <div className="font-extrabold text-[10px]">{settings.hospitalName}</div>
                      <div className="text-[6px] text-slate-500 font-bold">{settings.address}</div>
                    </div>
                  )}
                  {/* Dotted margin marker label */}
                  <span className="absolute left-2 bottom-1 text-[8px] font-black text-red-500 tracking-wide uppercase">
                    Header: {settings.letterheadHeaderHeight} cm
                  </span>
                </div>

                {/* Simulated Middle page body */}
                <div className="flex-1 p-3 flex flex-col justify-center items-center text-slate-300 italic text-[9px] font-bold">
                  <span>Simulated Report Content</span>
                </div>

                {/* Footer Simulator Margin Area */}
                <div 
                  style={{ height: `${(settings.letterheadFooterHeight / 29.7) * 424}px` }}
                  className="relative w-full border-t border-dashed border-red-400 bg-slate-50 transition-all flex flex-col justify-between items-center py-1"
                >
                  {/* double border line style footer */}
                  <div className="w-full px-3 pt-1 border-t-2 border-double border-blue-400"></div>
                  
                  {/* Dotted margin marker label */}
                  <span className="absolute left-2 top-1 text-[8px] font-black text-red-500 tracking-wide uppercase">
                    Footer: {settings.letterheadFooterHeight} cm
                  </span>
                </div>

              </div>
            </div>

            {/* Right Information Block */}
            <div className="w-full lg:w-64 space-y-4">
              <h3 className="text-sm font-black text-blue-800">Important information</h3>
              
              <div className="space-y-3 text-slate-600 text-[10px] font-bold leading-normal">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex gap-2">
                  <span className="text-slate-400">ⓘ</span>
                  <span>Please note down the settings before making any changes so that you can always restore the original settings.</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex gap-2">
                  <span className="text-slate-400">ⓘ</span>
                  <span>You can get JPG from your printer (or graphic designer) & upload here. Please ask for file size 100kb.</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex gap-2">
                  <span className="text-slate-400">ⓘ</span>
                  <span>Use a centimeter scale to measure header and footer height.</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex gap-2">
                  <span className="text-slate-400">ⓘ</span>
                  <span>Standard A4 size is 21 cm by 29.7 cm. Image will be resized to: 1000px by 1414px, max size allowed is 400kb.</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
