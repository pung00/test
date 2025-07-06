import React, { useState, useEffect } from "react";
import {
  Camera,
  X,
  Edit,
  Save,
  Plus,
  LogIn,
  LogOut,
  User,
  Calendar,
  Image,
} from "lucide-react";

// Firebase imports
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase 설정
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 컬렉션 이름들
const COLLECTIONS = {
  VISION: "vision",
  MISSION: "mission",
  NEWS: "news",
  PRACTICE_RECORDS: "practiceRecords",
  GALLERY_POSTS: "galleryPosts",
};

// Base64 이미지 변환 함수
const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// 이미지 압축 함수 (크기 최적화)
const compressImage = (file, maxWidth = 800, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // 비율을 유지하면서 크기 조정
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      // 캔버스에 이미지 그리기
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Base64로 변환 (JPEG, 품질 조정)
      const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
      resolve(compressedBase64);
    };

    img.src = URL.createObjectURL(file);
  });
};

// 스마트 이미지 처리 함수
const handleImageProcessing = async (file) => {
  // 파일 크기 체크
  const fileSizeMB = file.size / (1024 * 1024);

  if (fileSizeMB > 5) {
    throw new Error("파일 크기는 5MB 이하여야 합니다.");
  }

  // 이미지 크기에 따른 압축 처리
  if (fileSizeMB > 1) {
    console.log("큰 이미지 감지: 압축 처리");
    return await compressImage(file, 600, 0.7); // 더 많이 압축
  } else if (fileSizeMB > 0.5) {
    console.log("중간 이미지: 가벼운 압축");
    return await compressImage(file, 800, 0.8);
  } else {
    console.log("작은 이미지: 원본 유지");
    return await convertToBase64(file);
  }
};

// Firebase 서비스 함수들
const getVisionContent = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.VISION));
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data().content;
    }
    return "우리는 하늘의 심정을 닮은 참사랑을 통해 가정, 이웃, 사회를 하나로 잇는 평화로운 구리를 만들기 위해 이 플랫폼을 시작합니다. 모든 시민이 주체가 되어 참가정 문화를 확산하고, 사랑과 정성이 실천되는 공동체를 함께 만들어갑니다.";
  } catch (error) {
    console.error("비전 내용 가져오기 실패:", error);
    return "우리는 하늘의 심정을 닮은 참사랑을 통해 가정, 이웃, 사회를 하나로 잇는 평화로운 구리를 만들기 위해 이 플랫폼을 시작합니다.";
  }
};

const saveVisionContent = async (content) => {
  try {
    const visionCollection = collection(db, COLLECTIONS.VISION);
    const querySnapshot = await getDocs(visionCollection);

    if (querySnapshot.empty) {
      await addDoc(visionCollection, { content, updatedAt: new Date() });
    } else {
      const docRef = doc(db, COLLECTIONS.VISION, querySnapshot.docs[0].id);
      await updateDoc(docRef, { content, updatedAt: new Date() });
    }
  } catch (error) {
    console.error("비전 내용 저장 실패:", error);
    throw error;
  }
};

const getMissionContent = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.MISSION));
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data().content;
    }
    return "오늘 가족에게 사랑한다고 말해보세요.";
  } catch (error) {
    console.error("미션 내용 가져오기 실패:", error);
    return "오늘 가족에게 사랑한다고 말해보세요.";
  }
};

const saveMissionContent = async (content) => {
  try {
    const missionCollection = collection(db, COLLECTIONS.MISSION);
    const querySnapshot = await getDocs(missionCollection);

    if (querySnapshot.empty) {
      await addDoc(missionCollection, { content, updatedAt: new Date() });
    } else {
      const docRef = doc(db, COLLECTIONS.MISSION, querySnapshot.docs[0].id);
      await updateDoc(docRef, { content, updatedAt: new Date() });
    }
  } catch (error) {
    console.error("미션 내용 저장 실패:", error);
    throw error;
  }
};

const getNewsItems = async () => {
  try {
    const q = query(
      collection(db, COLLECTIONS.NEWS),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("뉴스 목록 가져오기 실패:", error);
    return [
      {
        id: "default1",
        content: "참사랑 바자회 (7월 15일, 구리교회 카페)",
        createdAt: new Date(),
      },
      {
        id: "default2",
        content: "청년 버스킹과 사랑토크 (7월 22일, 구리역 광장)",
        createdAt: new Date(),
      },
    ];
  }
};

const addNewsItem = async (content) => {
  try {
    await addDoc(collection(db, COLLECTIONS.NEWS), {
      content,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("뉴스 항목 추가 실패:", error);
    throw error;
  }
};

const deleteNewsItem = async (id) => {
  try {
    // 기본 아이템은 삭제하지 않음
    if (id.toString().startsWith("default")) {
      throw new Error("기본 뉴스 항목은 삭제할 수 없습니다.");
    }
    await deleteDoc(doc(db, COLLECTIONS.NEWS, id));
  } catch (error) {
    console.error("뉴스 항목 삭제 실패:", error);
    throw error;
  }
};

const getPracticeRecords = async () => {
  try {
    const q = query(
      collection(db, COLLECTIONS.PRACTICE_RECORDS),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.createdAt?.toDate
          ? data.createdAt.toDate().toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      };
    });
  } catch (error) {
    console.error("실천 기록 가져오기 실패:", error);
    return [
      {
        id: "default1",
        author: "김참사랑",
        date: "2025-07-07",
        content:
          "오늘 아침 가족들과 함께 아침식사를 하며 서로 사랑한다고 말했어요. 따뜻한 하루의 시작이었습니다.",
      },
      {
        id: "default2",
        author: "이나눔",
        date: "2025-07-06",
        content:
          "이웃 할머니께 반찬을 나누어 드렸습니다. 할머니의 환한 미소가 저에게 더 큰 행복을 주었어요.",
      },
    ];
  }
};

const addPracticeRecord = async (author, content) => {
  try {
    await addDoc(collection(db, COLLECTIONS.PRACTICE_RECORDS), {
      author,
      content,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("실천 기록 추가 실패:", error);
    throw error;
  }
};

const getGalleryPosts = async () => {
  try {
    const q = query(
      collection(db, COLLECTIONS.GALLERY_POSTS),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.createdAt?.toDate
          ? data.createdAt.toDate().toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      };
    });
  } catch (error) {
    console.error("갤러리 게시물 가져오기 실패:", error);
    return [
      {
        id: "default1",
        author: "박사랑",
        date: "2025-07-07",
        image:
          "https://images.unsplash.com/photo-1516627145497-ae4099b4cc4f?w=400&h=300&fit=crop",
        description: "가족과 함께한 소중한 시간들",
      },
      {
        id: "default2",
        author: "최나눔",
        date: "2025-07-06",
        image:
          "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop",
        description: "이웃과 함께 나눈 따뜻한 마음",
      },
    ];
  }
};

const addGalleryPost = async (author, description, imageFile) => {
  try {
    const imageBase64 = await handleImageProcessing(imageFile);

    await addDoc(collection(db, COLLECTIONS.GALLERY_POSTS), {
      author,
      description,
      image: imageBase64,
      imageSize: Math.round(imageFile.size / 1024), // KB 단위
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("갤러리 게시물 추가 실패:", error);
    throw error;
  }
};

// 메인 App 컴포넌트
const App = () => {
  // 상태 관리
  const [currentSection, setCurrentSection] = useState("vision");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({
    username: "",
    password: "",
  });

  // 편집 모드 상태
  const [isEditingVision, setIsEditingVision] = useState(false);
  const [isEditingMission, setIsEditingMission] = useState(false);
  const [isEditingNews, setIsEditingNews] = useState(false);

  // 콘텐츠 데이터
  const [visionContent, setVisionContent] = useState("");
  const [missionContent, setMissionContent] = useState("");
  const [newsContent, setNewsContent] = useState([]);
  const [practiceRecords, setPracticeRecords] = useState([]);
  const [galleryPosts, setGalleryPosts] = useState([]);

  // 폼 데이터
  const [formData, setFormData] = useState({
    author: "",
    content: "",
    description: "",
    image: null,
    imagePreview: null,
  });

  // 데이터 로드
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [vision, mission, news, practices, gallery] = await Promise.all([
        getVisionContent(),
        getMissionContent(),
        getNewsItems(),
        getPracticeRecords(),
        getGalleryPosts(),
      ]);

      setVisionContent(vision);
      setMissionContent(mission);
      setNewsContent(news);
      setPracticeRecords(practices);
      setGalleryPosts(gallery);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
      // 오류 발생 시에도 기본 데이터 유지
    } finally {
      setLoading(false);
    }
  };

  // 관리자 로그인
  const handleAdminLogin = () => {
    if (
      adminCredentials.username === "admin" &&
      adminCredentials.password === "admin123"
    ) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminCredentials({ username: "", password: "" });
    } else {
      alert("잘못된 관리자 정보입니다.");
    }
  };

  // 관리자 로그아웃
  const handleAdminLogout = () => {
    setIsAdmin(false);
    setIsEditingVision(false);
    setIsEditingMission(false);
    setIsEditingNews(false);
  };

  // 모달 열기
  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
    setFormData({
      author: "",
      content: "",
      description: "",
      image: null,
      imagePreview: null,
    });
  };

  // 모달 닫기
  const closeModal = () => {
    setShowModal(false);
    setModalType("");
    setFormData({
      author: "",
      content: "",
      description: "",
      image: null,
      imagePreview: null,
    });
  };

  // 실천 기록 저장
  const savePracticeRecord = async () => {
    if (!formData.author || !formData.content) {
      alert("작성자와 내용을 모두 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      await addPracticeRecord(formData.author, formData.content);
      const updatedRecords = await getPracticeRecords();
      setPracticeRecords(updatedRecords);
      closeModal();
      alert("실천 기록이 저장되었습니다!");
    } catch (error) {
      console.error("실천 기록 저장 실패:", error);
      alert("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  // 갤러리 게시물 저장
  const saveGalleryPost = async () => {
    if (!formData.author || !formData.description || !formData.image) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      await addGalleryPost(
        formData.author,
        formData.description,
        formData.image
      );
      const updatedPosts = await getGalleryPosts();
      setGalleryPosts(updatedPosts);
      closeModal();
      alert("갤러리 게시물이 저장되었습니다!");
    } catch (error) {
      console.error("갤러리 게시물 저장 실패:", error);
      alert("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  // 파일 업로드 처리
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 파일 크기 체크 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        alert("파일 크기는 5MB 이하여야 합니다.");
        return;
      }

      // 이미지 파일인지 체크
      if (!file.type.startsWith("image/")) {
        alert("이미지 파일만 업로드 가능합니다.");
        return;
      }

      setFormData({
        ...formData,
        image: file,
        imagePreview: URL.createObjectURL(file),
      });
    }
  };

  // 콘텐츠 저장
  const saveContent = async (type) => {
    try {
      setLoading(true);
      if (type === "vision") {
        await saveVisionContent(visionContent);
        setIsEditingVision(false);
        alert("비전 내용이 저장되었습니다!");
      } else if (type === "mission") {
        await saveMissionContent(missionContent);
        setIsEditingMission(false);
        alert("미션 내용이 저장되었습니다!");
      } else if (type === "news") {
        setIsEditingNews(false);
        alert("뉴스 편집이 완료되었습니다!");
      }
    } catch (error) {
      console.error("콘텐츠 저장 실패:", error);
      alert("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  // 뉴스 항목 추가
  const addNewsItemHandler = async () => {
    const newItem = prompt("새로운 소식을 입력하세요:");
    if (newItem && newItem.trim()) {
      try {
        setLoading(true);
        await addNewsItem(newItem.trim());
        const updatedNews = await getNewsItems();
        setNewsContent(updatedNews);
        alert("새 소식이 추가되었습니다!");
      } catch (error) {
        console.error("뉴스 추가 실패:", error);
        alert("추가에 실패했습니다. 다시 시도해주세요.");
      } finally {
        setLoading(false);
      }
    }
  };

  // 뉴스 항목 삭제
  const removeNewsItem = async (id) => {
    if (window.confirm("이 소식을 삭제하시겠습니까?")) {
      try {
        setLoading(true);
        await deleteNewsItem(id);
        const updatedNews = await getNewsItems();
        setNewsContent(updatedNews);
        alert("소식이 삭제되었습니다!");
      } catch (error) {
        console.error("뉴스 삭제 실패:", error);
        alert("삭제에 실패했습니다. 다시 시도해주세요.");
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-pink-200 text-gray-800 text-center py-8">
        <h1 className="text-3xl font-bold mb-2">
          참사랑으로 하나된 구리 플랫폼
        </h1>
        <p className="text-lg">
          사랑은 줄수록 커진다 - 구리 참사랑 실천 커뮤니티
        </p>

        {/* 관리자 로그인/로그아웃 버튼 */}
        <div className="mt-4">
          {isAdmin ? (
            <div className="flex items-center justify-center gap-2">
              <User className="w-4 h-4" />
              <span className="text-sm">관리자 모드</span>
              <button
                onClick={handleAdminLogout}
                className="ml-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                <LogOut className="w-4 h-4 inline mr-1" />
                로그아웃
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAdminLogin(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <LogIn className="w-4 h-4 inline mr-1" />
              관리자 로그인
            </button>
          )}
        </div>
      </header>

      {/* 네비게이션 */}
      <nav className="bg-white border-b border-gray-200 flex justify-center gap-8 py-4">
        {["vision", "action", "gallery", "news", "contact"].map((section) => (
          <button
            key={section}
            onClick={() => setCurrentSection(section)}
            className={`text-gray-700 font-semibold hover:text-pink-600 ${
              currentSection === section
                ? "text-pink-600 border-b-2 border-pink-600"
                : ""
            }`}
          >
            {section === "vision" && "비전"}
            {section === "action" && "실천하기"}
            {section === "gallery" && "문화갤러리"}
            {section === "news" && "소식"}
            {section === "contact" && "문의"}
          </button>
        ))}
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="max-w-4xl mx-auto p-8">
        {/* 비전 선언 */}
        {currentSection === "vision" && (
          <section className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">비전 선언</h2>
              {isAdmin && (
                <button
                  onClick={() => {
                    if (isEditingVision) {
                      saveContent("vision");
                    } else {
                      setIsEditingVision(true);
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled={loading}
                >
                  {isEditingVision ? (
                    <Save className="w-4 h-4" />
                  ) : (
                    <Edit className="w-4 h-4" />
                  )}
                  {isEditingVision ? "저장" : "편집"}
                </button>
              )}
            </div>
            <div className="bg-gray-50 rounded-md p-4">
              {isEditingVision ? (
                <textarea
                  value={visionContent}
                  onChange={(e) => setVisionContent(e.target.value)}
                  className="w-full h-32 p-3 border border-gray-300 rounded-md"
                  placeholder="비전 내용을 입력하세요..."
                />
              ) : (
                <p className="text-gray-700 leading-relaxed">{visionContent}</p>
              )}
            </div>
          </section>
        )}

        {/* 실천하기 */}
        {currentSection === "action" && (
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              오늘의 참사랑 실천 미션
            </h2>

            {/* 오늘의 미션 */}
            <div className="bg-yellow-50 rounded-md p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <strong className="text-gray-800">오늘의 미션:</strong>
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (isEditingMission) {
                        saveContent("mission");
                      } else {
                        setIsEditingMission(true);
                      }
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    disabled={loading}
                  >
                    {isEditingMission ? (
                      <Save className="w-3 h-3" />
                    ) : (
                      <Edit className="w-3 h-3" />
                    )}
                    {isEditingMission ? "저장" : "편집"}
                  </button>
                )}
              </div>
              {isEditingMission ? (
                <input
                  type="text"
                  value={missionContent}
                  onChange={(e) => setMissionContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="오늘의 미션을 입력하세요..."
                />
              ) : (
                <p className="text-gray-700">"{missionContent}"</p>
              )}
            </div>

            {/* 나의 실천 기록하기 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  나의 실천 기록하기
                </h3>
                <button
                  onClick={() => openModal("practice")}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  disabled={loading}
                >
                  <Plus className="w-4 h-4" />
                  기록 추가
                </button>
              </div>

              {/* 실천 기록 목록 */}
              <div className="space-y-4">
                {practiceRecords.map((record) => (
                  <div key={record.id} className="bg-gray-50 rounded-md p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-800">
                        {record.author}
                      </span>
                      <Calendar className="w-4 h-4 text-gray-500 ml-auto" />
                      <span className="text-sm text-gray-500">
                        {record.date}
                      </span>
                    </div>
                    <p className="text-gray-700">{record.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 문화갤러리 */}
        {currentSection === "gallery" && (
          <section className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">문화갤러리</h2>
              <button
                onClick={() => openModal("gallery")}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                disabled={loading}
              >
                <Plus className="w-4 h-4" />
                사진 추가
              </button>
            </div>

            {/* 갤러리 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {galleryPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-gray-50 rounded-md overflow-hidden"
                >
                  <img
                    src={post.image}
                    alt={post.description}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.src =
                        "https://images.unsplash.com/photo-1516627145497-ae4099b4cc4f?w=400&h=300&fit=crop";
                    }}
                  />
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-800">
                        {post.author}
                      </span>
                      <Calendar className="w-4 h-4 text-gray-500 ml-auto" />
                      <span className="text-sm text-gray-500">{post.date}</span>
                    </div>
                    <p className="text-gray-700">{post.description}</p>
                    {post.imageSize && (
                      <p className="text-xs text-gray-400 mt-1">
                        원본 크기: {post.imageSize}KB
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 소식 및 행사 */}
        {currentSection === "news" && (
          <section className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">소식 및 행사</h2>
              {isAdmin && (
                <div className="flex gap-2">
                  <button
                    onClick={addNewsItemHandler}
                    className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                    disabled={loading}
                  >
                    <Plus className="w-3 h-3" />
                    추가
                  </button>
                  <button
                    onClick={() => {
                      if (isEditingNews) {
                        saveContent("news");
                      } else {
                        setIsEditingNews(true);
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    disabled={loading}
                  >
                    {isEditingNews ? (
                      <Save className="w-3 h-3" />
                    ) : (
                      <Edit className="w-3 h-3" />
                    )}
                    {isEditingNews ? "저장" : "편집"}
                  </button>
                </div>
              )}
            </div>
            <div className="bg-gray-50 rounded-md p-4">
              <strong className="text-gray-800 block mb-2">[7월 예정]</strong>
              <ul className="space-y-2">
                {newsContent.map((item, index) => (
                  <li
                    key={item.id || index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-gray-700">• {item.content}</span>
                    {isAdmin && isEditingNews && (
                      <button
                        onClick={() => removeNewsItem(item.id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                        disabled={loading}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* 문의 */}
        {currentSection === "contact" && (
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              문의 / 참여제안
            </h2>
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-gray-700 mb-2">
                참여 아이디어나 궁금한 사항은 아래 이메일로 보내주세요.
              </p>
              <p className="text-gray-700">
                📧{" "}
                <a
                  href="mailto:guri@onelove.org"
                  className="text-blue-600 hover:underline"
                >
                  guri@onelove.org
                </a>
              </p>
            </div>
          </section>
        )}
      </main>

      {/* 푸터 */}
      <footer className="text-center py-4 bg-gray-100 text-gray-600 mt-8">
        © 2025 참사랑 구리 플랫폼 | Designed with 사랑
      </footer>

      {/* 관리자 로그인 모달 */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">관리자 로그인</h3>
              <button
                onClick={() => setShowAdminLogin(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  아이디
                </label>
                <input
                  type="text"
                  value={adminCredentials.username}
                  onChange={(e) =>
                    setAdminCredentials({
                      ...adminCredentials,
                      username: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="관리자 아이디를 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호
                </label>
                <input
                  type="password"
                  value={adminCredentials.password}
                  onChange={(e) =>
                    setAdminCredentials({
                      ...adminCredentials,
                      password: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="비밀번호를 입력하세요"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAdminLogin}
                  className="flex-1 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled={loading}
                >
                  로그인
                </button>
                <button
                  onClick={() => setShowAdminLogin(false)}
                  className="flex-1 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  취소
                </button>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <p>테스트 계정: admin / admin123</p>
            </div>
          </div>
        </div>
      )}

      {/* 게시물 작성 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">
                {modalType === "practice"
                  ? "실천 기록 추가"
                  : "문화갤러리 사진 추가"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  작성자
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) =>
                    setFormData({ ...formData, author: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="이름을 입력하세요"
                />
              </div>

              {modalType === "practice" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    내용
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md h-32"
                    placeholder="오늘의 실천 내용을 작성해주세요..."
                  />
                </div>
              )}

              {modalType === "gallery" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      사진 (최대 5MB)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                    {formData.imagePreview && (
                      <div className="mt-2">
                        <img
                          src={formData.imagePreview}
                          alt="미리보기"
                          className="w-full h-32 object-cover rounded-md"
                        />
                        <div className="text-xs text-gray-500 mt-1 space-y-1">
                          <p>
                            파일 크기:{" "}
                            {formData.image
                              ? Math.round(formData.image.size / 1024)
                              : 0}
                            KB
                          </p>
                          {formData.image && (
                            <p className="text-blue-600">
                              {formData.image.size > 1024 * 1024
                                ? "🔄 이미지가 자동으로 압축되어 저장됩니다"
                                : "✅ 원본 크기로 저장됩니다"}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      설명
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md h-24"
                      placeholder="사진에 대한 간단한 설명을 작성해주세요..."
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <button
                  onClick={
                    modalType === "practice"
                      ? savePracticeRecord
                      : saveGalleryPost
                  }
                  className="flex-1 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  disabled={loading}
                >
                  {loading ? "저장 중..." : "저장"}
                </button>
                <button
                  onClick={closeModal}
                  className="flex-1 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
