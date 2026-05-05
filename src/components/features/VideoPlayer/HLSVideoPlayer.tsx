'use client';

import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

// Register quality levels plugin only once
if (typeof window !== 'undefined' && !videojs.getPlugin('qualityLevels')) {
  require('videojs-contrib-quality-levels');
}

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
  const [currentQuality, setCurrentQuality] = useState<string>('Auto');

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
        const qualityLevels = (player as any).qualityLevels();
        
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
            private isCurrentlySelected: boolean = false;
            
            constructor(player: any, options: any) {
              super(player, options);
              (this as any).selectable = true;
              this.isCurrentlySelected = options.selected || false;
              (this as any).selected(this.isCurrentlySelected);
            }
            
            handleClick() {
              const qualityLevels = (this.player() as any).qualityLevels();
              const parent = this.options_.parent;
              const player = this.player();
              
              if (!player) {
                console.warn('Player not available');
                return;
              }
              
              // Save current time before switching
              const currentTime = player.currentTime();
              const wasPaused = player.paused();
              
              console.log('🎯 Quality clicked:', this.options_.label, 'Value:', this.options_.value);
              
              // First, remove 'vjs-selected' class from ALL menu items using DOM query
              if (parent && parent.el) {
                const allMenuItems = parent.el().querySelectorAll('.vjs-menu-item');
                allMenuItems.forEach((item: Element) => {
                  item.classList.remove('vjs-selected');
                  item.setAttribute('aria-checked', 'false');
                });
              }
              
              // Also try to deselect via Video.js API
              if (parent && parent.children) {
                const menuItems = parent.children();
                for (let i = 0; i < menuItems.length; i++) {
                  const item = menuItems[i];
                  if (item && item.el) {
                    item.el().classList.remove('vjs-selected');
                    item.el().setAttribute('aria-checked', 'false');
                    if (typeof item.selected === 'function') {
                      item.selected(false);
                    }
                    if (item.isCurrentlySelected !== undefined) {
                      item.isCurrentlySelected = false;
                    }
                  }
                }
              }
              
              // Add 'vjs-selected' class to ONLY this item
              this.el().classList.add('vjs-selected');
              this.el().setAttribute('aria-checked', 'true');
              this.isCurrentlySelected = true;
              (this as any).selected(true);
              
              console.log('✅ Selection updated - only', this.options_.label, 'should be selected');
              
              // Save selected value to parent
              if (parent && typeof parent.setSelectedQuality === 'function') {
                parent.setSelectedQuality(this.options_.value);
              }
              
              if (this.options_.value === 'auto') {
                // Enable all qualities for auto mode
                for (let i = 0; i < qualityLevels.length; i++) {
                  qualityLevels[i].enabled = true;
                }
                console.log('🔄 Quality set to: Auto (adaptive streaming enabled)');
                setCurrentQuality('Auto');
              } else {
                // Get the selected quality height
                const selectedHeight = qualityLevels[this.options_.value].height;
                
                // FIRST: Disable all quality levels
                for (let i = 0; i < qualityLevels.length; i++) {
                  qualityLevels[i].enabled = false;
                }
                
                // THEN: Enable only the selected quality
                qualityLevels[this.options_.value].enabled = true;
                
                console.log('🔄 Quality set to:', selectedHeight + 'p');
                console.log('🔄 Forcing quality switch by clearing buffer...');
                setCurrentQuality(selectedHeight + 'p');
                
                // Force immediate quality switch by triggering a seek
                const tech = player.tech({ IWillNotUseThisInPlugins: true });
                if (tech && (tech as any).vhs) {
                  // Clear the buffer to force reload with new quality
                  try {
                    const mediaSource = (tech as any).vhs.mediaSource;
                    if (mediaSource && mediaSource.sourceBuffers) {
                      for (let i = 0; i < mediaSource.sourceBuffers.length; i++) {
                        const sourceBuffer = mediaSource.sourceBuffers[i];
                        if (!sourceBuffer.updating && sourceBuffer.buffered.length > 0) {
                          const start = sourceBuffer.buffered.start(0);
                          const end = sourceBuffer.buffered.end(sourceBuffer.buffered.length - 1);
                          if (end > start) {
                            sourceBuffer.remove(start, end);
                            console.log('🧹 Cleared buffer to force quality switch');
                          }
                        }
                      }
                    }
                  } catch (err) {
                    console.warn('⚠️ Could not clear buffer:', err);
                  }
                }
              }
              
              // Update button label immediately
              if (parent && typeof parent.updateLabel === 'function') {
                const controlTextEl = parent.el().querySelector('.vjs-control-text');
                if (controlTextEl) {
                  controlTextEl.textContent = this.options_.label;
                  console.log('🏷️ Button label updated to:', this.options_.label);
                }
              }
              
              // Force a seek to trigger quality switch
              setTimeout(() => {
                if (player && !player.isDisposed()) {
                  // Seek to current position to force reload
                  player.currentTime(currentTime);
                  
                  if (!wasPaused && player) {
                    player.play()?.catch((err: Error) => {
                      console.warn('⚠️ Autoplay after quality change failed:', err);
                    });
                  }
                }
              }, 200);
            }
          }
          
          // Custom menu button for quality selector
          class QualityMenuButton extends MenuButton {
            private selectedQualityValue: string | number = 'auto';
            
            constructor(player: any, options: any) {
              super(player, options);
              this.addClass('vjs-quality-selector');
              (this as any).controlText('Quality');
              
              // Update button label when quality changes
              const qualityLevels = player.qualityLevels();
              qualityLevels.on('change', () => {
                this.updateLabel();
              });
              
              // Set initial label
              setTimeout(() => this.updateLabel(), 100);
            }
            
            setSelectedQuality(value: string | number) {
              this.selectedQualityValue = value;
            }
            
            getSelectedQuality() {
              return this.selectedQualityValue;
            }
            
            updateLabel() {
              const qualityLevels = (this.player() as any).qualityLevels();
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
              const qualityLevels = (this.player() as any).qualityLevels();
              const items = [];
              const selectedValue = this.selectedQualityValue;
              
              // Add "Auto" option
              items.push(new QualityMenuItem(this.player(), {
                label: 'Auto',
                value: 'auto',
                selected: selectedValue === 'auto',
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
                  selected: selectedValue === index,
                  parent: this
                }));
              });
              
              console.log('📋 Quality menu items created:', items.length, 'Selected:', selectedValue);
              
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
      
      // Track segment loading to verify quality switching
      const tech = player.tech({ IWillNotUseThisInPlugins: true });
      if (tech && (tech as any).vhs) {
        (tech as any).vhs.on('loadedplaylist', () => {
          const qualityLevels = (player as any).qualityLevels();
          console.log('📋 Playlist loaded, current quality levels:');
          for (let i = 0; i < qualityLevels.length; i++) {
            const level = qualityLevels[i];
            console.log(`   ${level.height}p: ${level.enabled ? '✅ ENABLED' : '❌ disabled'}`);
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
        
        /* Ensure controls are visible and properly aligned */
        .video-js .vjs-control-bar {
          display: flex !important;
          align-items: center;
          height: 3em;
        }
        
        .video-js .vjs-control {
          display: flex !important;
          align-items: center;
          justify-content: center;
        }
        
        /* Fix video dimensions */
        .video-js video {
          width: 100% !important;
          height: 100% !important;
          object-fit: contain;
        }
        
        /* Quality Selector Styles */
        .vjs-quality-selector {
          min-width: 70px !important;
          order: 8;
        }
        
        .vjs-quality-selector .vjs-control-text {
          display: inline-block !important;
          position: relative !important;
          clip: auto !important;
          width: auto !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0 6px !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          line-height: 3em !important;
          color: white !important;
          text-transform: none !important;
          letter-spacing: 0.3px;
        }
        
        .vjs-quality-selector .vjs-icon-placeholder {
          display: none !important;
        }
        
        .vjs-quality-selector button {
          min-width: 70px !important;
        }
        
        .vjs-quality-selector .vjs-menu {
          min-width: 140px;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.95);
          border-radius: 8px;
          padding: 8px 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }
        
        .vjs-quality-selector .vjs-menu-item {
          text-align: left;
          padding: 12px 24px;
          font-size: 15px;
          font-weight: 500;
          color: white;
          transition: all 0.2s;
        }
        
        /* Hide the "selected" accessibility text */
        .vjs-quality-selector .vjs-menu-item .vjs-control-text {
          display: none !important;
        }
        
        .vjs-quality-selector .vjs-menu-item.vjs-selected {
          background-color: #0ea5e9 !important;
          color: white !important;
          font-weight: 600;
        }
        
        /* Only show checkmark on selected items */
        .vjs-quality-selector .vjs-menu-item::before {
          content: '';
          margin-right: 0;
        }
        
        .vjs-quality-selector .vjs-menu-item.vjs-selected::before {
          content: '✓ ';
          margin-right: 8px;
          font-weight: bold;
          font-size: 16px;
        }
        
        /* Remove selected state from non-selected items */
        .vjs-quality-selector .vjs-menu-item:not(.vjs-selected) {
          background-color: transparent !important;
        }
        
        .vjs-quality-selector .vjs-menu-item:not(.vjs-selected)::before {
          content: '' !important;
          margin-right: 0 !important;
        }
        
        .vjs-quality-selector .vjs-menu-item:hover {
          background-color: rgba(14, 165, 233, 0.3) !important;
          cursor: pointer;
        }
        
        .vjs-quality-selector .vjs-menu-item.vjs-selected:hover {
          background-color: #0ea5e9 !important;
        }
        
        .vjs-quality-selector .vjs-menu-item:focus {
          background-color: rgba(14, 165, 233, 0.2);
        }
      `}</style>
    </div>
  );
}
