import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, storage } from "../../firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, orderBy } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { FiPlus, FiVideo, FiUploadCloud, FiArrowLeft, FiPlay, FiFileText, FiClock, FiShield } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";

const FacultyLectures = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "",
    videoFile: null
  });

  useEffect(() => {
    // 1. Fetch Course Info
    const fetchCourse = async () => {
      const snap = await getDoc(doc(db, "courses", courseId));
      if (snap.exists()) setCourse(snap.data());
    };

    // 2. Fetch Real-time Lectures
    const q = query(collection(db, "lectures"), where("courseId", "==", courseId), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setLectures(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    fetchCourse();
    return () => unsub();
  }, [courseId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.videoFile) return toast.error("Please select a video file!");

    setUploading(true);
    try {
      // 1. Upload Video to Storage
      const fileRef = ref(storage, `lectures/${courseId}/${Date.now()}_${formData.videoFile.name}`);
      const uploadTask = uploadBytesResumable(fileRef, formData.videoFile);

      uploadTask.on("state_changed", 
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(Math.round(p));
        },
        (error) => toast.error(error.message),
        async () => {
          const videoUrl = await getDownloadURL(uploadTask.snapshot.ref);

          // 2. Save Lecture Data
          await addDoc(collection(db, "lectures"), {
            courseId,
            title: formData.title,
            description: formData.description,
            duration: formData.duration,
            videoUrl,
            createdAt: serverTimestamp()
          });

          toast.success("Lecture Published Successfully!");
          setShowAdd(false);
          setUploading(false);
          setProgress(0);
          setFormData({ title: "", description: "", duration: "", videoFile: null });
        }
      );
    } catch (err) {
      toast.error("Upload failed!");
      setUploading(false);
    }
  };

  return (
    <div className="p-4 md:p-10 space-y-10">
      <Toaster />
      
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-lg transition-all">
            <FiArrowLeft />
          </button>
          <div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter">Curriculum <span className="text-blue-600">Builder</span></h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{course?.title}</p>
          </div>
        </div>
        <button onClick={() => setShowAdd(true)} className="w-full md:w-max bg-slate-900 text-white px-10 py-5 rounded-3xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl">
          <FiPlus className="inline mr-2" /> Add Lecture
        </button>
      </div>

      {/* Lectures List - High-end UI */}
      <div className="grid grid-cols-1 gap-6">
        {lectures.map((lec, index) => (
          <div key={lec.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-blue-200 transition-all shadow-sm">
            <div className="flex items-center gap-6 w-full">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-300 italic text-xl">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div className="flex-1">
                <h4 className="font-black text-slate-900 uppercase italic leading-tight text-lg">{lec.title}</h4>
                <div className="flex flex-wrap gap-4 mt-2">
                   <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1"><FiClock className="text-blue-500" /> {lec.duration} Mins</span>
                   <span className="text-[9px] font-bold text-emerald-500 uppercase flex items-center gap-1"><FiPlay /> Ready to Stream</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
               <button className="flex-1 md:px-8 py-4 bg-slate-50 text-slate-400 rounded-xl font-black text-[10px] uppercase cursor-not-allowed flex items-center justify-center gap-2">
                 <FiShield /> Admin Protected
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] p-10 md:p-16 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-3xl font-black uppercase italic mb-10 tracking-tighter text-slate-900">Push <span className="text-blue-600">New Lesson</span></h2>
            <form onSubmit={handleUpload} className="space-y-6">
              <input type="text" placeholder="LECTURE TITLE" className="w-full bg-slate-50 p-6 rounded-2xl outline-none font-black text-[11px] uppercase border border-slate-100" required onChange={(e) => setFormData({...formData, title: e.target.value})} />
              <input type="number" placeholder="DURATION (MINUTES)" className="w-full bg-slate-50 p-6 rounded-2xl outline-none font-black text-[11px] border border-slate-100" required onChange={(e) => setFormData({...formData, duration: e.target.value})} />
              <textarea placeholder="LESSON DESCRIPTION..." className="w-full bg-slate-50 p-6 rounded-2xl outline-none font-bold h-32 border border-slate-100" required onChange={(e) => setFormData({...formData, description: e.target.value})} />

              <div className="border-4 border-dashed border-slate-50 p-10 rounded-[3rem] text-center bg-slate-50/50">
                <input type="file" accept="video/*" className="hidden" id="video" onChange={(e) => setFormData({...formData, videoFile: e.target.files[0]})} />
                <label htmlFor="video" className="cursor-pointer">
                  <FiUploadCloud className="mx-auto text-4xl text-blue-500 mb-3" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{formData.videoFile ? formData.videoFile.name : "Select MP4 Video File"}</p>
                </label>
              </div>

              {uploading && (
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full transition-all" style={{ width: `${progress}%` }}></div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={uploading} className="flex-1 bg-slate-900 text-white py-6 rounded-3xl font-black uppercase text-[11px] tracking-widest hover:bg-blue-600 transition-all shadow-xl">
                  {uploading ? `Uploading ${progress}%` : "Launch Lecture"}
                </button>
                <button type="button" onClick={() => setShowAdd(false)} className="px-10 py-6 text-slate-400 font-black uppercase text-[10px]">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyLectures;