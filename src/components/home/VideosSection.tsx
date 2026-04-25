import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { type ShiurItem } from '@/api/getVideos';
import { useVideos } from '@/hooks/useQueries';

function getThumb(video: ShiurItem): string {
  if (video.thumbnail) return video.thumbnail;
  if (video.youtubeId) return `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`;
  return "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="320" height="180" fill="%231B2A4A"/><polygon points="130,60 130,120 190,90" fill="%23C9A84C"/></svg>');
}

function VideoCard({ video }: { video: ShiurItem }) {
  return (
    <Link to={`/shiurei-torah/${video.linkId}`} aria-label={`צפה בשיעור: ${video.title}`}>
      <Card className="overflow-hidden hover:shadow-lg hover:-translate-y-1 hover:bg-[#F5F0E8] transition-all duration-300 cursor-pointer group h-full">
        <div className="relative aspect-video bg-primary">
          <img
            src={getThumb(video)}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <Play className="h-6 w-6 sm:h-7 sm:w-7 text-white mr-1" fill="white" />
            </div>
          </div>
          {video.duration && (
            <div className="absolute bottom-2 left-2 bg-black/80 text-white px-2 py-0.5 rounded text-xs font-semibold">
              {video.duration}
            </div>
          )}
          {video.category && (
            <div className="absolute top-2 right-2 bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full text-xs font-semibold shadow-md">
              {video.category}
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-serif font-bold text-primary mb-1.5 line-clamp-2 group-hover:text-secondary transition-colors text-sm sm:text-base leading-snug">
            {video.title}
          </h3>
          <p className="text-xs text-muted-foreground">
            {video.date}{video.duration ? ` • ${video.duration}` : ''}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function VideosSection() {
  const { data, isLoading: loading } = useVideos();
  const videos = (data?.shiurim ?? []).slice(0, 4);

  return (
    <section className="bg-background py-12 sm:py-16">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">

        {/* Section header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-secondary rounded-full" />
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-primary">שיעורי וידאו אחרונים</h2>
          </div>
          <Link to="/shiurei-torah">
            <Button variant="outline" size="sm" className="gap-2 text-sm hidden sm:flex">
              לכל שיעורי הוידאו
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-xl bg-muted animate-pulse aspect-[4/3]" />
            ))}
          </div>
        ) : videos.length === 0 ? null : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {videos.map(v => <VideoCard key={v.id} video={v} />)}
          </div>
        )}

        {/* Mobile "all videos" button */}
        <div className="text-center mt-6 sm:hidden">
          <Link to="/shiurei-torah">
            <Button variant="outline" className="gap-2 w-full min-h-[44px]">
              לכל שיעורי הוידאו
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}
