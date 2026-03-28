'use client';

import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-contrib-quality-levels';

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
            // Optimize chunk loading - only buffer what's needed
            bandwidth: 4194304, // Initial bandwidth estimate (4 Mbps)
            limitRenditionByPlayerDimensions: false,
            smoothQualityChange: true,
            // Buffer settings for better quality switching
            maxPlaylistRetries: 3,
            experimentalBufferBasedABR: true,
            // Limit forward buffer to 30 seconds (3 chunks at 10s each)
            maxMaxBufferLength: 30,
            maxBufferLength: 30,
            maxBufferSize: 60 * 1000 * 1000, // 60 MB max buffer
            // Fast quality switching
            fastQualityChange: true,
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
        }, 1000);
      });

      // Set source
      player.src({
        src: videoSource,
        type: sourceType
      });

      playerRef.current = player;

      // Add quality selector after source is loaded and quality levels are available
      player.on('loadedmetadata', () => {
        console.log('📊 Video metadata loaded');
        
        // Initialize quality levels plugin
        const qualityLevels = player.qualityLevels();
        
        console.log('🔍 Quality Levels Object:', qualityLevels);
        console.log('🔍 Quality Levels Length:', qualityLevels ? qualityLevels.length : 'undefined');
        
        if (qualityLevels && qualityLevels.length > 0) {
          console.log('📺 Available quality levels:', qualityLevels.length);
          
          // Log available qualities with all details
          for (let i = 0; i < qualityLevels.length; i++) {
            const level = qualityLevels[i];
            console.log(`   Quality ${i}:`, {
              height: level.height,
              width: level.width,
              bitrate: level.bitrate,
              enabled: level.enabled,
              id: level.id
            });
          }
          
          // Listen for quality level changes
          qualityLevels.on('change', () => {
            console.log('🔄 Quality level changed');
            const enabledLevels = [];
            for (let i = 0; i < qualityLevels.length; i++) {
              const level = qualityLevels[i];
              if (level.enabled) {
                enabledLevels.push(`${level.height}p (${level.bitrate} bps)`);
              }
            }
            console.log(`   Enabled qualities: ${enabledLevels.join(', ')}`);
          });
          
          // Create custom quality selector button
          const MenuButton = videojs.getComponent('MenuButton');
          const MenuItem = videojs.getComponent('MenuItem');
          
          // Custom menu item for each quality
          class QualityMenuItem extends MenuItem {
            constructor(player: videojs.Player, options: any) {
              super(player, options);
              this.selectable = true;
              this.selected(options.selected || false);
            }
            
            handleClick() {
              const qualityLevels = this.player().qualityLevels();
              const parent = this.options_.parent;
              const player = this.player();
              
              // Save current time before switching
              const currentTime = player.currentTime();
              const wasPaused = player.paused();
              
              if (this.options_.value === 'auto') {
                // Enable all qualities for auto mode
                for (let i = 0; i < qualityLevels.length; i++) {
                  qualityLevels[i].enabled = true;
                }
                console.log('🔄 Quality set to: Auto (adaptive streaming enabled)');
              } else {
                // Get the selected quality height
                const selectedHeight = qualityLevels[this.options_.value].height;
                
                // Enable all quality levels with the same height, disable others
                for (let i = 0; i < qualityLevels.length; i++) {
                  qualityLevels[i].enabled = (qualityLevels[i].height === selectedHeight);
                }
                console.log('🔄 Quality set to:', selectedHeight + 'p');
              }
              
              // Resume from saved position after a short delay
              setTimeout(() => {
                if (player && !player.isDisposed()) {
                  player.currentTime(currentTime);
                  if (!wasPaused) {
                    player.play().catch((err: Error) => {
                      console.warn('⚠️ Autoplay after quality change failed:', err);
                    });
                  }
                }
              }, 100);
              
              // Update selected state for all menu items
              if (parent && parent.children) {
                const menuItems = parent.children();
                for (let i = 0; i < menuItems.length; i++) {
                  const item = menuItems[i];
                  if (item && typeof item.selected === 'function') {
                    item.selected(item.options_.value === this.options_.value);
                  }
                }
              }
              
              // Update button label
              if (parent && typeof parent.updateLabel === 'function') {
                parent.updateLabel();
              }
            }
          }
          
          // Custom menu button for quality selector
          class QualityMenuButton extends MenuButton {
            constructor(player: videojs.Player, options: any) {
              super(player, options);
              this.addClass('vjs-quality-selector');
              this.controlText('Quality');
              
              // Update button label when quality changes
              const qualityLevels = player.qualityLevels();
              qualityLevels.on('change', () => {
                this.updateLabel();
              });
              
              // Set initial label
              setTimeout(() => this.updateLabel(), 100);
            }
            
            updateLabel() {
              const qualityLevels = this.player().qualityLevels();
              let currentQuality = 'Auto';
              
              // Count enabled qualities
              let enabledCount = 0;
              let enabledHeight = -1;
              
              for (let i = 0; i < qualityLevels.length; i++) {
                if (qualityLevels[i].enabled) {
                  enabledCount++;
                  if (enabledHeight === -1) {
                    enabledHeight = qualityLevels[i].height;
                  }
                }
              }
              
              // If not all qualities are enabled, show the specific quality
              if (enabledCount < qualityLevels.length && enabledHeight > 0) {
                currentQuality = enabledHeight + 'p';
              }
              
              // Update button text - use textContent instead of icon placeholder
              const controlTextEl = this.el().querySelector('.vjs-control-text');
              if (controlTextEl) {
                controlTextEl.textContent = currentQuality;
              }
              
              // Also update the button's aria-label
              this.el().setAttribute('aria-label', `Quality: ${currentQuality}`);
            }
            
            createItems() {
              const qualityLevels = this.player().qualityLevels();
              const items = [];
              
              // Add "Auto" option (default)
              items.push(new QualityMenuItem(this.player(), {
                label: 'Auto',
                value: 'auto',
                selected: true,
                parent: this
              }));
              
              // Group quality levels by height to avoid duplicates
              const qualityMap = new Map<number, number>();
              for (let i = 0; i < qualityLevels.length; i++) {
                const height = qualityLevels[i].height;
                if (!qualityMap.has(height)) {
                  qualityMap.set(height, i);
                }
              }
              
              // Sort by height (descending) and create menu items
              const sortedHeights = Array.from(qualityMap.keys()).sort((a, b) => b - a);
              
              sortedHeights.forEach(height => {
                const index = qualityMap.get(height)!;
                items.push(new QualityMenuItem(this.player(), {
                  label: height + 'p',
                  value: index,
                  selected: false,
                  parent: this
                }));
              });
              
              return items;
            }
            
            buildCSSClass() {
              return `vjs-quality-selector ${super.buildCSSClass()}`;
            }
          }
          
          // Register the component
          videojs.registerComponent('QualityMenuButton', QualityMenuButton);
          
          // Add quality button to control bar (before fullscreen button)
          const controlBar = player.getChild('controlBar');
          if (controlBar) {
            const fullscreenToggle = controlBar.getChild('fullscreenToggle');
            const fullscreenIndex = controlBar.children().indexOf(fullscreenToggle);
            
            controlBar.addChild('QualityMenuButton', {}, fullscreenIndex);
            console.log('✅ Quality selector added to control bar');
          }
        } else {
          console.log('⚠️ No quality levels available');
        }
      });

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
        
        /* Quality Selector Styles */
        .vjs-quality-selector {
          min-width: 60px;
        }
        
        .vjs-quality-selector .vjs-control-text {
          display: inline-block !important;
          position: relative !important;
          clip: auto !important;
          width: auto !important;
          height: auto !important;
          padding: 0 8px;
          font-size: 13px;
          font-weight: 600;
          line-height: 3em;
          color: white;
        }
        
        .vjs-quality-selector .vjs-icon-placeholder {
          display: none !important;
        }
        
        .vjs-quality-selector button {
          min-width: 60px;
        }
        
        .vjs-quality-selector .vjs-menu {
          min-width: 100px;
          bottom: 100%;
        }
        
        .vjs-quality-selector .vjs-menu-item {
          text-align: center;
          padding: 8px 16px;
          font-size: 14px;
        }
        
        .vjs-quality-selector .vjs-menu-item.vjs-selected {
          background-color: var(--vjs-theme-city--primary);
          color: white;
        }
        
        .vjs-quality-selector .vjs-menu-item:hover {
          background-color: rgba(14, 165, 233, 0.2);
        }
      `}</style>
    </div>
  );
}
