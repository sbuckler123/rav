/**
 * Videos library - support for multiple video sources
 */

export type VideoType = 'youtube' | 'direct';

export interface VideoItem {
  id: string | number;
  title: string;
  description?: string;
  date: string;
  duration: string;
  views: string;
  category: string;
  isNew?: boolean;
  // Video source
  videoType: VideoType;
  videoId?: string; // For YouTube videos
  videoUrl?: string; // For direct URLs (StreamGates, MP4, etc.)
  thumbnailUrl?: string; // Custom thumbnail (required for non-YouTube)
}

export const FEATURED_VIDEO: VideoItem = {
  id: 'featured',
  title: 'הלכות ברכות הראייה - סימנים רכב-רכח',
  description: 'שיעור מקיף בהלכות ברכות הראייה, הכולל עיון מעמיק במקורות ובפוסקים, עם דוגמאות מעשיות ליישום ההלכה בחיי היום-יום.',
  date: '15.07.2025',
  duration: '52 דקות',
  views: '2,450',
  category: 'הלכה',
  videoType: 'youtube',
  videoId: '0DSLq0Mofa8',
  isNew: true
};

export const VIDEOS: VideoItem[] = [
  { id: 1, title: 'הלכות ברכות הראייה', date: '12.07.2025', duration: '45 דקות', views: '1,250', category: 'הלכה', videoType: 'youtube', videoId: '0DSLq0Mofa8' },
  { id: 2, title: 'פרשת בלק - מסרים לדורנו', date: '10.07.2025', duration: '38 דקות', views: '980', category: 'פרשת שבוע', videoType: 'youtube', videoId: '0DSLq0Mofa8' },
  { id: 3, title: 'הלכות תפילה ומנהגי ישראל', date: '08.07.2025', duration: '52 דקות', views: '1,560', category: 'תפילה', videoType: 'youtube', videoId: '0DSLq0Mofa8' },
  { id: 4, title: 'סוגיות בכשרות המטבח', date: '05.07.2025', duration: '41 דקות', views: '890', category: 'כשרות', videoType: 'youtube', videoId: '0DSLq0Mofa8' },
  { id: 5, title: 'הלכות חנוכה ומנהגיה', date: '03.07.2025', duration: '47 דקות', views: '1,120', category: 'מועדים', videoType: 'youtube', videoId: '0DSLq0Mofa8' },
  { id: 6, title: 'דיני קידוש והבדלה', date: '01.07.2025', duration: '35 דקות', views: '780', category: 'שבת', videoType: 'youtube', videoId: '0DSLq0Mofa8' },
  { 
    id: 7, 
    title: 'משפטים - רוקם בפרשה', 
    date: '28.06.2025', 
    duration: '29 דקות', 
    views: '650', 
    category: 'פרשת שבוע',
    videoType: 'direct',
    videoUrl: 'https://cplayer.streamgates.net/KolBarama.php?Sv=kol-barama-s3&Pp=kol_barama&Tt=12.02.26%20-%20%D7%9E%D7%A9%D7%A4%D7%98%D7%99%D7%9D%20%D7%A8%D7%95%D7%A7%D7%9D%20%D7%91%D7%A4%D7%A8%D7%A9%D7%94.mp4&Ap=false&live=false&Xs=VOD/12.02.26%20-%20%D7%9E%D7%A9%D7%A4%D7%98%D7%99%D7%9D%20%D7%A8%D7%95%D7%A7%D7%9D%20%D7%91%D7%A4%D7%A8%D7%A9%D7%94.mp4&playsinline=1',
    thumbnailUrl: 'https://images.fillout.com/orgid-590181/flowpublicid-faiasrbeba/widgetid-default/da4RdkwRZDxv5w1uPJeYYk/pasted-image-1771332416037.png'
  },
  { id: 8, title: 'תפילת שמונה עשרה - עיונים', date: '25.06.2025', duration: '55 דקות', views: '1,340', category: 'תפילה', videoType: 'youtube', videoId: '0DSLq0Mofa8' },
  { id: 9, title: 'פרשת פנחס - זכות הארץ', date: '22.06.2025', duration: '43 דקות', views: '920', category: 'פרשת שבוע', videoType: 'youtube', videoId: '0DSLq0Mofa8' },
  { id: 10, title: 'הלכות ברכת המזון', date: '20.06.2025', duration: '37 דקות', views: '710', category: 'ברכות', videoType: 'youtube', videoId: '0DSLq0Mofa8' },
  { id: 11, title: 'דיני שבת - מלאכות האש', date: '18.06.2025', duration: '48 דקות', views: '1,050', category: 'שבת', videoType: 'youtube', videoId: '0DSLq0Mofa8' },
  { id: 12, title: 'אמונה וביטחון בימינו', date: '15.06.2025', duration: '51 דקות', views: '1,480', category: 'אמונה', videoType: 'youtube', videoId: '0DSLq0Mofa8' },
];

/**
 * Get thumbnail URL for a video based on its type
 */
export function getVideoThumbnail(video: VideoItem): string {
  if (video.videoType === 'youtube' && video.videoId) {
    return `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;
  }
  if (video.thumbnailUrl) {
    return video.thumbnailUrl;
  }
  // Fallback placeholder
  return 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360" fill="%23E5E7EB"><rect width="480" height="360" fill="%23E5E7EB"/><path d="M240 120c-33 0-60 27-60 60s27 60 60 60 60-27 60-60-27-60-60-60zm0 100c-22 0-40-18-40-40s18-40 40-40 40 18 40 40-18 40-40 40z" fill="%236B7280"/></svg>'
  );
}

/**
 * Get high-res thumbnail for featured video
 */
export function getFeaturedVideoThumbnail(video: VideoItem): string {
  if (video.videoType === 'youtube' && video.videoId) {
    return `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`;
  }
  return getVideoThumbnail(video);
}
