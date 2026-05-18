import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Share2, Eye, Clock, Calendar, ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import SEO from '@/components/SEO';
import { type ShiurItem } from '@/api/getVideos';
import { useVideos } from '@/hooks/useQueries';

function getThumb(video: ShiurItem): string {
  if (video.thumbnail) return video.thumbnail;
  if (video.youtubeId) return `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`;
  return "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="320" height="180" fill="%231B2A4A"/><polygon points="130,60 130,120 190,90" fill="%23C9A84C"/></svg>');
}

export default function VideoDetailPage() {
  const { id } = useParams();
  const { data, isLoading: loading } = useVideos();
  const videos: ShiurItem[] = data?.shiurim ?? [];

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <p className="text-muted-foreground">טוען שיעור...</p>
      </div>
    );
  }

  const video = videos.find((v) => v.linkId === id);

  if (!video) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8">
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold mb-4">שיעור לא נמצא</h2>
              <Button asChild>
                <Link to="/shiurei-torah">חזרה לשיעורים</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const idx = videos.findIndex((v) => v.linkId === id);
  const prevVideo = videos[idx + 1] ?? null;
  const nextVideo = videos[idx - 1] ?? null;

  const otherVideos = videos.filter((v) => v.linkId !== id);

  const sameCategory = video.category
    ? otherVideos.filter((v) => v.category === video.category).slice(0, 3)
    : [];

  const categoryVideos = sameCategory.length > 0 ? sameCategory : otherVideos.slice(0, 3);

  const mostViewed = [...otherVideos]
    .sort((a, b) => b.views - a.views)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-muted/30">
      <SEO
        title={video.title}
        description={`שיעור וידאו מאת הרב קלמן מאיר בר: ${video.title}`}
        image={getThumb(video)}
      />
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-6 sm:py-8">
        <Breadcrumbs items={[
          { label: 'דף הבית', href: '/' },
          { label: 'שיעורי תורה', href: '/shiurei-torah' },
          { label: video.title }
        ]} />

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 mt-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">

            {/* כותרת ומטא-דאטה */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {video.category && <Badge variant="secondary">{video.category}</Badge>}
                  {video.views > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <Eye className="h-3 w-3" />
                      {video.views.toLocaleString()}
                    </Badge>
                  )}
                  {video.isNew && <Badge variant="default">חדש</Badge>}
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold mb-3 leading-snug">
                  {video.title}
                </h1>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {video.date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      {video.date}
                    </div>
                  )}
                  {video.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      {video.duration}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Video Player */}
            <Card className="overflow-hidden border-2 border-primary/20">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                {video.videoType === 'youtube' && video.youtubeId ? (
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${video.youtubeId}`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : video.videoType === 'direct' && video.videoUrl ? (
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={video.videoUrl}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                ) : (
                  <div className="absolute inset-0 bg-muted flex items-center justify-center">
                    <p className="text-muted-foreground">אין וידאו זמין</p>
                  </div>
                )}
              </div>
            </Card>

            {/* כפתורי פעולה */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <Button
                  variant="outline"
                  className="gap-2 min-h-[44px]"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: video.title, url: window.location.href }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(window.location.href).then(() =>
                        toast.success('הקישור הועתק ללוח!')
                      );
                    }
                  }}
                >
                  <Share2 className="h-4 w-4" />
                  שתף
                </Button>
              </CardContent>
            </Card>

            {/* תיאור */}
            {video.description && (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-serif font-bold mb-3">אודות השיעור</h2>
                  <div className="prose prose-slate max-w-none text-sm sm:text-base">
                    {video.description.split('\n\n').map((para, i) => (
                      <p key={i} className="mb-3 leading-relaxed">{para}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ניווט */}
            <div className="flex justify-between gap-3">
              {prevVideo ? (
                <Link to={`/shiurei-torah/${prevVideo.linkId}`} className="flex-1 sm:flex-none">
                  <Button variant="outline" className="gap-2 w-full sm:w-auto min-h-[44px]">
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">השיעור הקודם</span>
                    <span className="sm:hidden">קודם</span>
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" className="gap-2 flex-1 sm:flex-none min-h-[44px]" disabled>
                  <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">השיעור הקודם</span>
                  <span className="sm:hidden">קודם</span>
                </Button>
              )}
              {nextVideo ? (
                <Link to={`/shiurei-torah/${nextVideo.linkId}`} className="flex-1 sm:flex-none">
                  <Button variant="outline" className="gap-2 w-full sm:w-auto min-h-[44px]">
                    <span className="hidden sm:inline">השיעור הבא</span>
                    <span className="sm:hidden">הבא</span>
                    <ChevronLeft className="h-4 w-4 flex-shrink-0" />
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" className="gap-2 flex-1 sm:flex-none min-h-[44px]" disabled>
                  <span className="hidden sm:inline">השיעור הבא</span>
                  <span className="sm:hidden">הבא</span>
                  <ChevronLeft className="h-4 w-4 flex-shrink-0" />
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">

            {/* עוד בקטגוריה זו / שיעורים נוספים */}
            {categoryVideos.length > 0 && (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-base">
                      {sameCategory.length > 0 ? 'עוד בקטגוריה זו' : 'שיעורים נוספים'}
                    </h3>
                    {sameCategory.length > 0 && video.category && (
                      <Badge variant="secondary" className="text-xs">{video.category}</Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    {categoryVideos.map((v) => (
                      <Link key={v.linkId} to={`/shiurei-torah/${v.linkId}`}>
                        <div className="flex gap-3 hover:bg-muted p-2 rounded-lg transition-colors cursor-pointer group">
                          <div className="relative flex-shrink-0">
                            <img
                              src={getThumb(v)}
                              alt={v.title}
                              className="w-20 h-14 sm:w-24 sm:h-16 object-cover rounded"
                            />
                            {v.duration && (
                              <span className="absolute bottom-1 left-1 bg-black/80 text-white text-[10px] px-1 rounded">
                                {v.duration}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-2 group-hover:text-secondary transition-colors">
                              {v.title}
                            </p>
                            {v.date && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Calendar className="h-3 w-3 flex-shrink-0" />
                                {v.date}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {sameCategory.length > 0 && video.category && (
                    <Link to={`/shiurei-torah?category=${encodeURIComponent(video.category)}`}>
                      <Button variant="outline" size="sm" className="w-full mt-4 min-h-[44px] sm:min-h-0 text-xs">
                        כל השיעורים בקטגוריה
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}

            {/* הנצפים ביותר */}
            {mostViewed.length > 0 && (
              <Card className="bg-[#FAF8F2]">
                <CardContent className="p-4 sm:p-6">
                  <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-secondary" />
                    הנצפים ביותר
                  </h3>
                  <div className="space-y-2">
                    {mostViewed.map((v, i) => (
                      <Link key={v.linkId} to={`/shiurei-torah/${v.linkId}`}>
                        <div className="flex gap-3 hover:bg-muted p-2 rounded-lg transition-colors cursor-pointer group items-start">
                          <div className="flex-shrink-0 w-7 h-7 bg-secondary/10 rounded-full flex items-center justify-center text-secondary font-bold text-sm mt-0.5">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-2 group-hover:text-secondary transition-colors">
                              {v.title}
                            </p>
                            {v.views > 0 && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Eye className="h-3 w-3 flex-shrink-0" />
                                {v.views.toLocaleString()} צפיות
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
