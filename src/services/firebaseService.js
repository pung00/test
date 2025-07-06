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
import { db } from "../config/firebase";

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
export const processImage = async (file) => {
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

// 비전 내용 가져오기
export const getVisionContent = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.VISION));
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data().content;
    }
    return "우리는 하늘의 심정을 닮은 참사랑을 통해 가정, 이웃, 사회를 하나로 잇는 평화로운 구리를 만들기 위해 이 플랫폼을 시작합니다. 모든 시민이 주체가 되어 참가정 문화를 확산하고, 사랑과 정성이 실천되는 공동체를 함께 만들어갑니다.";
  } catch (error) {
    console.error("비전 내용 가져오기 실패:", error);
    throw error;
  }
};

// 비전 내용 저장/업데이트
export const saveVisionContent = async (content) => {
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

// 미션 내용 가져오기
export const getMissionContent = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.MISSION));
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data().content;
    }
    return "오늘 가족에게 사랑한다고 말해보세요.";
  } catch (error) {
    console.error("미션 내용 가져오기 실패:", error);
    throw error;
  }
};

// 미션 내용 저장/업데이트
export const saveMissionContent = async (content) => {
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

// 뉴스 목록 가져오기
export const getNewsItems = async () => {
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

// 뉴스 항목 추가
export const addNewsItem = async (content) => {
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

// 뉴스 항목 삭제
export const deleteNewsItem = async (id) => {
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

// 실천 기록 가져오기
export const getPracticeRecords = async () => {
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

// 실천 기록 추가
export const addPracticeRecord = async (author, content) => {
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

// 갤러리 게시물 가져오기
export const getGalleryPosts = async () => {
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

// 갤러리 게시물 추가 (Base64 방식)
export const addGalleryPost = async (author, description, imageFile) => {
  try {
    // Base64로 이미지 처리 (압축 포함)
    const imageBase64 = await processImage(imageFile);

    await addDoc(collection(db, COLLECTIONS.GALLERY_POSTS), {
      author,
      description,
      image: imageBase64,
      imageSize: Math.round(imageFile.size / 1024), // KB 단위로 원본 크기 저장
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("갤러리 게시물 추가 실패:", error);
    throw error;
  }
};
