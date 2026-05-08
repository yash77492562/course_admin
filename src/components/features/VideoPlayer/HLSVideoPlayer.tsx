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
  videoDuration?: number; // Duration in seconds from database
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
  videoDuration,
  className = '',
  onNext,
  onPrevious
}: HLSVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentQuality, setCurrentQuality] = useState<string>('Auto');

  // Log videoDuration prop
  console.log('🎬 HLSVideoPlayer received videoDuration:', videoDuration);
  // Ensure component is mounted before initializing Video.js
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Manual quality selector for individual playlists (no master playlist)
  const addManualQualitySelector = (player: any, qualities: Record<string, string>) => {
    const MenuButton = videojs.getComponent('MenuButton');
    const MenuItem = videojs.getComponent('MenuItem');
    
    // Custom menu item for manual quality switching
    class ManualQualityMenuItem extends MenuItem {
      private isCurrentlySelected: boolean = false;
      
      constructor(player: any, options: any) {
        super(player, options);
        (this as any).selectable = true;
        this.isCurrentlySelected = options.selected || false;
        (this as any).selected(this.isCurrentlySelected);
      }
      
      handleClick() {
        const parent = this.options_.parent;
        const player = this.player();
        
        if (!player) {
          console.warn('Player not available');
          return;
        }
        
        // Save current time before switching
        const currentTime = player.currentTime();
        const wasPaused = player.paused();
        
        // CRITICAL FIX: Save the current duration before switching
        // The duration is already correct from the initial load
        const savedDuration = player.duration();
        console.log('💾 Saving duration before quality switch:', savedDuration);
        
        console.log('🎯 Manual quality clicked:', this.options_.label, 'URL:', this.options_.url);
        
        // Remove selection from all items
        if (parent && parent.el) {
          const allMenuItems = parent.el().querySelectorAll('.vjs-menu-item');
          allMenuItems.forEach((item: Element) => {
            item.classList.remove('vjs-selected');
            item.setAttribute('aria-checked', 'false');
          });
        }
        
        // Add selection to this item
        this.el().classList.add('vjs-selected');
        this.el().setAttribute('aria-checked', 'true');
        this.isCurrentlySelected = true;
        (this as any).selected(true);
        
        console.log('✅ Selection updated - only', this.options_.label, 'should be selected');
        
        // Save selected value to parent
        if (parent && typeof parent.setSelectedQuality === 'function') {
          parent.setSelectedQuality(this.options_.label);
        }
        
        // Handle Auto mode (don't switch source, just update label)
        if (this.options_.isAuto) {
          setCurrentQuality('Auto');
          
          // Update button label
          if (parent && typeof parent.updateLabel === 'function') {
            parent.updateLabel();
            const iconPlaceholder = parent.el().querySelector('.vjs-icon-placeholder');
            if (iconPlaceholder) {
              iconPlaceholder.textContent = 'Auto';
              console.log('🏷️ Button label updated to: Auto');
            }
          }
          return; // Don't switch source for Auto
        }
        
        // Show loading spinner
        console.log('🔄 Adding loading spinner...');
        player.addClass('vjs-waiting');
        
        // Switch video source for specific quality
        try {
          console.log('🔄 Switching video source to:', this.options_.url);
          console.log('🔄 Current time before switch:', currentTime);
          console.log('🔄 Was paused:', wasPaused);
          
          // CRITICAL FIX: Pause and reset before changing source
          player.pause();
          console.log('⏸️ Player paused');
          
          // CRITICAL: Clear any existing error state before switching
          if (player.error()) {
            console.log('🧹 Clearing existing error state');
            player.error(null);
          }
          
          // Get tech reference once for both buffer clearing and source changing
          const tech = player.tech({ IWillNotUseThisInPlugins: true });
          
          // Clear source buffers to prevent conflicts
          if (tech && (tech as any).vhs) {
            try {
              const vhs = (tech as any).vhs;
              if (vhs.mediaSource && vhs.mediaSource.sourceBuffers) {
                console.log('🧹 Clearing source buffers before quality switch');
                for (let i = 0; i < vhs.mediaSource.sourceBuffers.length; i++) {
                  const sourceBuffer = vhs.mediaSource.sourceBuffers[i];
                  if (!sourceBuffer.updating && sourceBuffer.buffered.length > 0) {
                    try {
                      const start = sourceBuffer.buffered.start(0);
                      const end = sourceBuffer.buffered.end(sourceBuffer.buffered.length - 1);
                      if (end > start) {
                        sourceBuffer.remove(start, end);
                      }
                    } catch (err) {
                      console.warn('⚠️ Could not clear source buffer:', err);
                    }
                  }
                }
              }
            } catch (err) {
              console.warn('⚠️ Could not access source buffers:', err);
            }
          }
          
          // Set up event listener BEFORE changing source
          const handleLoadedMetadata = () => {
            console.log('📥 loadedmetadata - Metadata loaded for new quality');
            
            // CRITICAL FIX: For HLS, duration becomes available after playing starts
            // We need to wait for 'loadeddata' or start playing to get duration
            const proceedWithPlayback = () => {
              console.log('🔄 Removing loading spinner...');
              player.removeClass('vjs-waiting');
              
              // Start playing first (from beginning of nearest segment)
              if (!wasPaused) {
                console.log('▶️ Starting playback...');
                const playPromise = player.play();
                
                if (playPromise !== undefined) {
                  playPromise.then(() => {
                    console.log('✅ Video playing, now seeking to:', currentTime);
                    
                    // Once playing, seek to the desired time
                    // Use a small delay to ensure HLS has loaded some segments
                    setTimeout(() => {
                      player.currentTime(currentTime);
                      console.log('✅ Seeked to timestamp');
                    }, 300);
                  }).catch((err: Error) => {
                    console.warn('⚠️ Autoplay failed:', err);
                    player.removeClass('vjs-waiting');
                    // Try seeking anyway
                    player.currentTime(currentTime);
                  });
                }
              } else {
                console.log('⏸️ Video was paused, seeking without playing');
                // If paused, just seek
                setTimeout(() => {
                  player.currentTime(currentTime);
                }, 300);
              }
            };
            
            // For HLS videos, wait for 'loadeddata' event which fires when first frame is loaded
            // This ensures duration is available
            const handleLoadedData = () => {
              let duration = player.duration();
              
              // CRITICAL FIX: Use saved duration if new duration is not available
              if ((!duration || isNaN(duration) || duration === Infinity) && savedDuration && !isNaN(savedDuration) && savedDuration !== Infinity) {
                duration = savedDuration;
                console.log('📥 loadeddata - Using saved duration:', duration, 'seconds');
                
                // Manually set the duration on the player's tech
                const tech = player.tech({ IWillNotUseThisInPlugins: true });
                if (tech && tech.el_) {
                  // Store duration for Video.js to use
                  (tech as any).duration_ = savedDuration;
                  (player as any).cache_.duration = savedDuration;
                }
              } else {
                console.log('📥 loadeddata - First frame loaded, duration:', duration);
              }
              
              player.off('loadeddata', handleLoadedData);
              player.off('durationchange', handleDurationChange);
              player.off('playing', handlePlaying);
              
              if (duration && !isNaN(duration) && duration !== Infinity && duration > 0) {
                console.log('✅ Duration available:', duration, 'seconds');
              } else {
                console.log('⚠️ Duration still not available, but proceeding');
              }
              
              proceedWithPlayback();
            };
            
            // Sometimes duration only becomes available after video starts playing
            const handlePlaying = () => {
              const duration = player.duration();
              console.log('▶️ playing event - duration:', duration);
              
              if (duration && !isNaN(duration) && duration !== Infinity && duration > 0) {
                console.log('✅ Duration available after playing:', duration, 'seconds');
                player.off('loadeddata', handleLoadedData);
                player.off('durationchange', handleDurationChange);
                player.off('playing', handlePlaying);
                proceedWithPlayback();
              }
            };
            
            const handleDurationChange = () => {
              const duration = player.duration();
              console.log('🕐 Duration changed:', duration);
              
              if (duration && !isNaN(duration) && duration !== Infinity && duration > 0) {
                console.log('✅ Duration available via durationchange:', duration, 'seconds');
                player.off('loadeddata', handleLoadedData);
                player.off('durationchange', handleDurationChange);
                proceedWithPlayback();
              }
            };
            
            // Check if duration is already available
            let duration = player.duration();
            
            // CRITICAL FIX: Use saved duration if new duration is not available
            if ((!duration || isNaN(duration) || duration === Infinity) && savedDuration && !isNaN(savedDuration) && savedDuration !== Infinity) {
              duration = savedDuration;
              console.log('✅ Using saved duration:', duration, 'seconds');
              
              // Manually set the duration on the player's tech
              const tech = player.tech({ IWillNotUseThisInPlugins: true });
              if (tech && tech.el_) {
                (tech as any).duration_ = savedDuration;
                (player as any).cache_.duration = savedDuration;
              }
              
              proceedWithPlayback();
            } else if (duration && !isNaN(duration) && duration !== Infinity && duration > 0) {
              console.log('✅ Duration already available from HLS:', duration, 'seconds');
              proceedWithPlayback();
            } else {
              console.log('⏳ Waiting for loadeddata, durationchange, or playing event...');
              // Listen for all three events - whichever fires first with valid duration wins
              player.one('loadeddata', handleLoadedData);
              player.on('durationchange', handleDurationChange);
              player.one('playing', handlePlaying);
              
              // Fallback timeout after 3 seconds
              setTimeout(() => {
                player.off('loadeddata', handleLoadedData);
                player.off('durationchange', handleDurationChange);
                player.off('playing', handlePlaying);
                
                const currentDuration = player.duration();
                console.log('⏰ Timeout reached, duration:', currentDuration);
                
                if (!player.hasClass('vjs-waiting')) {
                  // Already proceeded, do nothing
                  return;
                }
                
                console.log('⏰ Proceeding after timeout');
                proceedWithPlayback();
              }, 3000);
            }
          };
          
          // Error handling - with recovery attempt
          const handleError = (e: any) => {
            const error = player.error();
            
            // Only log if it's not a recoverable error
            if (!error || error.code !== 3) {
              console.error('❌ Video error event:', e);
              if (error) {
                console.error('❌ Error code:', error.code);
                console.error('❌ Error message:', error.message);
              }
            }
            
            // Remove loading spinner
            player.removeClass('vjs-waiting');
            
            // Try to recover from MEDIA_ERR_DECODE silently
            if (error && error.code === 3) {
              console.log('🔄 Recovering from quality switch error...');
              
              // Clear the error to make player interactive again
              player.error(null);
              
              // Remove any error classes
              player.removeClass('vjs-error');
              
              // Ensure controls are enabled
              player.controls(true);
              
              // Try reloading after a short delay
              setTimeout(() => {
                player.load();
              }, 500);
            }
          };
          
          // Register event listeners
          player.one('loadedmetadata', handleLoadedMetadata);
          player.one('error', handleError);
          
          console.log('✅ Event listeners registered');
          
          // Change source using the tech directly for more reliable loading (reuse tech from above)
          if (tech && tech.el_) {
            console.log('🔧 Using tech to change source');
            tech.el_.src = this.options_.url;
            tech.el_.load();
            console.log('✅ Tech source changed and loaded');
          } else {
            // Fallback to normal method
            console.log('🔧 Using player.src() method');
            player.src({
              src: this.options_.url,
              type: 'application/x-mpegURL'
            });
            player.load();
            console.log('✅ Player source changed and loaded');
          }
          
          // Update button label
          if (parent && typeof parent.updateLabel === 'function') {
            parent.updateLabel();
            const iconPlaceholder = parent.el().querySelector('.vjs-icon-placeholder');
            if (iconPlaceholder) {
              iconPlaceholder.textContent = this.options_.label;
              console.log('🏷️ Button label updated to:', this.options_.label);
            }
          }
          
          setCurrentQuality(this.options_.label);
          
          // Fallback: Remove loading spinner after 10 seconds
          setTimeout(() => {
            if (player.hasClass('vjs-waiting')) {
              console.log('⏰ Fallback timeout - removing loading spinner');
              player.removeClass('vjs-waiting');
            }
          }, 10000);
          
        } catch (error) {
          console.error('❌ Error switching quality:', error);
          player.removeClass('vjs-waiting');
        }
      }
    }
    
    // Custom menu button for manual quality selector
    class ManualQualityMenuButton extends MenuButton {
      private selectedQualityValue: string = '';
      private qualities: Record<string, string>;
      
      constructor(player: any, options: any) {
        // CRITICAL: Set qualities BEFORE calling super
        // because super() calls createItems() which needs this.qualities
        const qualities = options.qualities || {};
        
        super(player, { ...options, qualities });
        
        this.qualities = qualities;
        this.addClass('vjs-quality-selector');
        (this as any).controlText('Quality');
        
        console.log('🎬 ManualQualityMenuButton constructor - qualities:', this.qualities);
        console.log('🎬 Number of qualities:', Object.keys(this.qualities).length);
        
        // Set initial quality to Auto
        this.selectedQualityValue = 'Auto';
        
        // Set initial label
        setTimeout(() => this.updateLabel(), 100);
      }
      
      setSelectedQuality(value: string) {
        this.selectedQualityValue = value;
      }
      
      getSelectedQuality() {
        return this.selectedQualityValue;
      }
      
      updateLabel() {
        const currentQuality = this.selectedQualityValue || 'Auto';
        
        // Update button text - create a text node to replace the entire content
        const controlTextEl = this.el().querySelector('.vjs-icon-placeholder');
        if (controlTextEl) {
          // Clear all content and set only the quality text
          controlTextEl.textContent = currentQuality;
        }
        
        // Update aria-label
        this.el().setAttribute('aria-label', `Quality: ${currentQuality}`);
      }
      
      createItems() {
        const items: any[] = [];
        
        // Get qualities from options since this is called during super() construction
        const qualities = (this as any).options_?.qualities || this.qualities || {};
        
        console.log('📋 createItems called - qualities:', qualities);
        console.log('📋 Number of qualities:', Object.keys(qualities).length);
        
        // Safety check
        if (!qualities || typeof qualities !== 'object' || Object.keys(qualities).length === 0) {
          console.error('❌ Qualities not available in createItems');
          return items;
        }
        
        // Add "Auto" option first (plays highest quality by default)
        items.push(new ManualQualityMenuItem(this.player(), {
          label: 'Auto',
          url: '', // Empty URL means use current/default
          selected: this.selectedQualityValue === 'Auto',
          parent: this,
          isAuto: true
        }));
        
        // Sort qualities by resolution (descending)
        const qualityKeys = Object.keys(qualities).sort((a, b) => {
          const aNum = parseInt(a);
          const bNum = parseInt(b);
          return bNum - aNum;
        });
        
        qualityKeys.forEach(quality => {
          items.push(new ManualQualityMenuItem(this.player(), {
            label: quality,
            url: qualities[quality],
            selected: quality === this.selectedQualityValue,
            parent: this
          }));
        });
        
        console.log('📋 Manual quality menu items created:', items.length);
        
        return items;
      }
      
      buildCSSClass() {
        return `vjs-quality-selector ${super.buildCSSClass()}`;
      }
    }
    
    // Register the component
    videojs.registerComponent('ManualQualityMenuButton', ManualQualityMenuButton);
    
    // Add quality button to control bar
    const controlBar = player.getChild('controlBar');
    if (controlBar) {
      // Check if quality selector already exists to prevent duplicates
      const existingQualitySelector = controlBar.getChild('ManualQualityMenuButton');
      if (existingQualitySelector) {
        console.log('⚠️ Quality selector already exists, removing old one');
        controlBar.removeChild(existingQualitySelector);
      }
      
      const fullscreenToggle = controlBar.getChild('fullscreenToggle');
      const fullscreenIndex = controlBar.children().indexOf(fullscreenToggle);
      
      controlBar.addChild('ManualQualityMenuButton', { qualities }, fullscreenIndex);
      console.log('✅ Manual quality selector added to control bar');
    }
  };

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
        
        // CRITICAL FIX: Set duration from database if available
        // This ensures duration is always available, even before HLS metadata loads
        if (videoDuration && videoDuration > 0) {
          console.log('📊 Setting duration from database:', videoDuration, 'seconds');
          // Store the database duration for use during quality switches
          (player as any)._databaseDuration = videoDuration;
        }
        
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
      
      // Suppress Video.js's internal error logging for MEDIA_ERR_DECODE (code 3)
      // Override the log.error function to filter out code 3 errors
      const originalLogError = videojs.log.error;
      videojs.log.error = function(...args: any[]) {
        // Check if this is a MEDIA_ERR_DECODE error
        const errorMessage = args.join(' ');
        if (errorMessage.includes('CODE:3') || errorMessage.includes('MEDIA_ERR_DECODE')) {
          // Silently ignore this error
          return;
        }
        // Log all other errors normally
        return originalLogError.apply(this, args);
      };

      // Add quality selector after source is loaded and quality levels are available
      // Use 'one' instead of 'on' to prevent duplicate quality selectors
      player.one('loadedmetadata', () => {
        console.log('📊 Video metadata loaded');
        
        // CRITICAL FIX: If we have hlsQualities prop, use manual quality selector
        // because individual playlists don't have resolution metadata
        if (hlsQualities && Object.keys(hlsQualities).length > 1) {
          console.log('📺 Using manual quality selector for individual playlists');
          console.log('📺 Available qualities:', Object.keys(hlsQualities).join(', '));
          
          // Create manual quality selector
          addManualQualitySelector(player, hlsQualities);
          return;
        }
        
        // Initialize quality levels plugin for master playlist
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

      // Handle errors - suppress MEDIA_ERR_DECODE during quality switching
      player.on('error', (error: any) => {
        const errorDisplay = player.error();
        
        // Only log non-recoverable errors (not MEDIA_ERR_DECODE which we handle)
        if (errorDisplay && errorDisplay.code !== 3) {
          console.error('❌ Video.js error:', error);
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
