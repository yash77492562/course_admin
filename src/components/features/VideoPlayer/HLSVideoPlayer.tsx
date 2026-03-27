'use client';

import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

interface HLSVideoPlayerProps {
  hlsMasterPlaylist?: string; // HLS master playlist URL (if available)
  hlsQualities?: Record<string, string>; // Individual quality playlists
  videoUrls?: Record<string, string>; // Fallback to regular MP4 URLs
  thumbnail?: string;
  title: string;
  autoplay?: boolean;
  className?: string;
  onNext?: () => void;
  onPrevious?: () => void;
}

export function HLSVideoPlayer({
  hlsMasterPlaylist,
  hlsQualities,
  videoUrls,
  thumbnail,
  title,
  autoplay = false,
  className = '',
  onNext,
  onPrevious
}: HLSVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted before initializing Video.js
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    // Wait for component to be mounted
    if (!isMounted) {
      return;
    }

    // Make sure Video.js player is only initialized once
    if (!playerRef.current && videoRef.current) {
      const videoElement = videoRef.current;

      // Determine video source - prioritize HLS
      let videoSource = '';
      let sourceType = 'video/mp4';

      if (hlsMasterPlaylist) {
        // Use master playlist if available
        videoSource = hlsMasterPlaylist;
        sourceType = 'application/x-mpegURL';
        console.log('🎬 Using HLS master playlist:', videoSource);
      } else if (hlsQualities && Object.keys(hlsQualities).length > 0) {
        // Use highest quality HLS playlist
        const qualities = Object.keys(hlsQualities).sort((a, b) => {
          const aHeight = parseInt(a);
          const bHeight = parseInt(b);
          return bHeight - aHeight; // Sort descending
        });
        const bestQuality = qualities[0];
        videoSource = hlsQualities[bestQuality];
        sourceType = 'application/x-mpegURL';
        console.log('🎬 Using HLS quality:', bestQuality, videoSource);
        console.log('📊 Available HLS qualities:', qualities.join(', '));
      } else if (videoUrls && Object.keys(videoUrls).length > 0) {
        // Fallback to MP4
        videoSource = Object.values(videoUrls)[0];
        sourceType = 'video/mp4';
        console.log('🎬 Using MP4 fallback:', videoSource);
      }

      if (!videoSource) {
        console.error('❌ No video source available');
        console.log('Debug - hlsMasterPlaylist:', hlsMasterPlaylist);
        console.log('Debug - hlsQualities:', hlsQualities);
        console.log('Debug - videoUrls:', videoUrls);
        return;
      }

      console.log('🎥 Initializing Video.js player...');
      console.log('   Video element:', videoElement);
      console.log('   Video element in DOM:', document.body.contains(videoElement));
      console.log('   Video element parent:', videoElement.parentElement);

      const player = videojs(videoElement, {
        controls: true,
        autoplay: true, // Enable autoplay
        muted: true, // Start muted to bypass browser restrictions
        preload: 'auto',
        responsive: true,
        aspectRatio: '16:9',
        fill: false,
        poster: thumbnail,
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        html5: {
          vhs: {
            overrideNative: true,
            enableLowInitialPlaylist: true,
          },
          nativeVideoTracks: false,
          nativeAudioTracks: false,
          nativeTextTracks: false
        }
      }, () => {
        console.log('✅ Video.js player ready');
        setIsReady(true);
        
        // Unmute after a short delay to allow autoplay
        setTimeout(() => {
          if (player && !player.isDisposed()) {
            player.muted(false);
            console.log('🔊 Video unmuted');
          }
        }, 1000); // Increased delay to 1 second
        
        // Add quality selector after player is ready
        const qualityLevels = (player as any).qualityLevels?.();
        if (qualityLevels && qualityLevels.length > 0) {
          console.log('📺 Setting up quality selector...');
          
          // Create quality menu button
          const MenuButton = videojs.getComponent('MenuButton');
          const MenuItem = videojs.getComponent('MenuItem');
          
          class QualityMenuItem extends MenuItem {
            constructor(player: any, options: any) {
              super(player, options);
              this.selectable = true;
              this.selected(options.selected);
            }
            
            handleClick() {
              const qualityLevels = (this.player() as any).qualityLevels();
              for (let i = 0; i < qualityLevels.length; i++) {
                qualityLevels[i].enabled = (i === this.options_.index);
              }
            }
          }
          
          class QualityMenuButton extends MenuButton {
            constructor(player: any, options: any) {
              super(player, options);
              this.controlText('Quality');
            }
            
            createItems() {
              const qualityLevels = (this.player() as any).qualityLevels();
              const items = [];
              
              // Add "Auto" option
              items.push(new QualityMenuItem(this.player(), {
                label: 'Auto',
                index: -1,
                selected: true
              }));
              
              // Add quality options
              for (let i = 0; i < qualityLevels.length; i++) {
                const level = qualityLevels[i];
                items.push(new QualityMenuItem(this.player(), {
                  label: level.height + 'p',
                  index: i,
                  selected: false
                }));
              }
              
              return items;
            }
          }
          
          videojs.registerComponent('QualityMenuButton', QualityMenuButton);
          
          // Add quality button to control bar
          player.getChild('controlBar')?.addChild('QualityMenuButton', {}, 
            player.getChild('controlBar')?.children().length - 1
          );
        }
      });

      // Set source
      player.src({
        src: videoSource,
        type: sourceType
      });

      playerRef.current = player;

      // Handle errors
      player.on('error', (error: any) => {
        console.error('❌ Video.js error:', error);
        const errorDisplay = player.error();
        if (errorDisplay) {
          console.error('Error code:', errorDisplay.code);
          console.error('Error message:', errorDisplay.message);
        }
      });

      // Debug: Log when video starts playing
      player.on('play', () => {
        console.log('▶️ Video started playing');
      });

      player.on('playing', () => {
        console.log('▶️ Video is playing');
        console.log('Video dimensions:', player.videoWidth(), 'x', player.videoHeight());
      });

      player.on('loadstart', () => {
        console.log('📥 Video load started');
      });

      player.on('loadeddata', () => {
        console.log('📥 Video data loaded');
      });

      // Log quality changes for HLS
      if (hlsMasterPlaylist || hlsQualities) {
        player.on('loadedmetadata', () => {
          console.log('📊 Video metadata loaded');
          const qualityLevels = (player as any).qualityLevels?.();
          if (qualityLevels) {
            console.log('📺 Available quality levels:', qualityLevels.length);
            for (let i = 0; i < qualityLevels.length; i++) {
              const level = qualityLevels[i];
              console.log(`   Quality ${i}:`, level.height + 'p', level.bitrate);
            }
          }
        });
      }
    }

    // Cleanup on unmount
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [isMounted, hlsMasterPlaylist, hlsQualities, videoUrls, thumbnail, autoplay]);

  return (
    <div className={`relative ${className}`}>
      {/* Video.js Player */}
      <div data-vjs-player className="w-full" style={{ minHeight: '500px' }}>
        <video
          ref={videoRef}
          className="video-js vjs-big-play-centered vjs-theme-city w-full h-full"
          playsInline
          muted
          autoPlay
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </div>

      {/* Navigation Controls */}
      {(onNext || onPrevious) && isReady && (
        <div className="absolute bottom-20 left-0 right-0 flex items-center justify-center gap-4 px-4">
          {onPrevious && (
            <button
              onClick={onPrevious}
              className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
              </svg>
              Previous
            </button>
          )}
          {onNext && (
            <button
              onClick={onNext}
              className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
            >
              Next
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Custom Styles for Video.js Theme */}
      <style jsx global>{`
        .video-js {
          width: 100% !important;
          height: 100% !important;
          min-height: 500px !important;
        }

        .vjs-theme-city {
          --vjs-theme-city--primary: #0ea5e9;
          --vjs-theme-city--secondary: #64748b;
        }

        .vjs-theme-city .vjs-big-play-button {
          background-color: rgba(0, 0, 0, 0.7);
          border: none;
          border-radius: 50%;
          width: 80px;
          height: 80px;
          line-height: 80px;
          font-size: 40px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .vjs-theme-city .vjs-big-play-button:hover {
          background-color: rgba(0, 0, 0, 0.9);
        }

        .vjs-theme-city .vjs-control-bar {
          background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
          display: flex !important;
        }

        .vjs-theme-city .vjs-play-progress {
          background-color: var(--vjs-theme-city--primary);
        }

        .vjs-theme-city .vjs-volume-level {
          background-color: var(--vjs-theme-city--primary);
        }
        
        /* Ensure controls are visible */
        .video-js .vjs-control-bar {
          display: flex !important;
        }
        
        .video-js .vjs-control {
          display: block !important;
        }
        
        /* Fix video dimensions */
        .video-js video {
          width: 100% !important;
          height: 100% !important;
          object-fit: contain;
        }
      `}</style>
    </div>
  );
}
