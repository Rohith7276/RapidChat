import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import VideoCall from "./pages/VideoCall";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useEffect } from "react";
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import CreateGroupPage from "./pages/CreateGroupPage";
import CreateYouTubeStream from "./components/streams/youtube/CreateYouTubeStream";
import YouTubePlayer from "./components/streams/youtube/YouTubePlayer";
import Stream from "./components/streams/Stream";
import PDFViewer from "./components/streams/pdf/PdfReader";
import UploadPDF from "./components/streams/pdf/UploadFile";
import WebsiteViewer from "./components/streams/website/WebsiteStream";
import ScreenShare from "./components/streams/screenShare/ScreenShare";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();
  const { theme } = useThemeStore();


  useEffect(() => {
    checkAuth();
  }, [checkAuth]);


  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );



  return (
    <div data-theme={theme}>
      <Navbar />



      <Routes>
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/create-group" element={authUser ? <CreateGroupPage /> : <Navigate to="/login" />} />
        <Route path="/stream" element={authUser ? <HomePage /> : <Navigate to="/login" />} >
          <Route index element={authUser ? <Stream /> : <Navigate to="/login" />} />
          <Route path="create-youtube-stream" element={authUser ? <CreateYouTubeStream /> : <Navigate to="/login" />} />
          <Route path="youtube-player" element={authUser ? <YouTubePlayer /> : <Navigate to="/login" />} />
          <Route path="upload-file" element={authUser ? <UploadPDF /> : <Navigate to="/login" />} />
          <Route path="file" element={authUser ? <PDFViewer /> : <Navigate to="/login" />} />

          <Route path="website" element={authUser ? <WebsiteViewer /> : <Navigate to="/login" />} />
          <Route path="screen-share" element={authUser ? <ScreenShare /> : <Navigate to="/login" />} />


        </Route>
        <Route path="/room/:roomId" element={authUser ? <VideoCall /> : <Navigate to="/login" />} >
           
        </Route>
      </Routes>

      <Toaster />
    </div>
  );
};
export default App;
