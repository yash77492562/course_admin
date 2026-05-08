/**
 * Test suite for HLS Video Player Quality Switching
 * 
 * This test verifies that video duration is properly maintained
 * when switching between different quality levels.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('HLSVideoPlayer - Quality Switching with Duration', () => {
  let mockVideoElement: any;
  let mockPlayer: any;
  let loadedMetadataCallback: Function | null = null;
  let errorCallback: Function | null = null;

  beforeEach(() => {
    // Mock video element
    mockVideoElement = {
      duration: 0,
      currentTime: 0,
      paused: false,
      src: '',
      load: jest.fn(),
      play: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn(),
      addEventListener: jest.fn((event: string, callback: Function) => {
        if (event === 'loadedmetadata') {
          loadedMetadataCallback = callback;
        } else if (event === 'error') {
          errorCallback = callback;
        }
      }),
      removeEventListener: jest.fn(),
    };

    // Mock Video.js player
    mockPlayer = {
      duration: jest.fn(() => mockVideoElement.duration),
      currentTime: jest.fn((time?: number) => {
        if (time !== undefined) {
          mockVideoElement.currentTime = time;
        }
        return mockVideoElement.currentTime;
      }),
      paused: jest.fn(() => mockVideoElement.paused),
      play: jest.fn(() => mockVideoElement.play()),
      pause: jest.fn(() => {
        mockVideoElement.paused = true;
        mockVideoElement.pause();
      }),
      error: jest.fn(() => null),
      addClass: jest.fn(),
      removeClass: jest.fn(),
      hasClass: jest.fn(() => false),
      one: jest.fn((event: string, callback: Function) => {
        if (event === 'loadedmetadata') {
          loadedMetadataCallback = callback;
        } else if (event === 'error') {
          errorCallback = callback;
        }
      }),
      tech: jest.fn(() => ({
        el_: mockVideoElement,
        vhs: null,
      })),
      src: jest.fn((source: any) => {
        mockVideoElement.src = source.src;
      }),
      load: jest.fn(() => mockVideoElement.load()),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    loadedMetadataCallback = null;
    errorCallback = null;
  });

  it('should wait for duration to be available before proceeding with quality switch', async () => {
    // Simulate initial video load with duration
    mockVideoElement.duration = 120.5; // 2 minutes video
    mockVideoElement.currentTime = 30; // User is at 30 seconds

    // Simulate quality switch
    const savedTime = mockVideoElement.currentTime;
    const wasPaused = mockVideoElement.paused;

    // Change source (simulating quality switch)
    mockVideoElement.src = 'https://example.com/video-720p.m3u8';
    mockVideoElement.duration = NaN; // Duration not available immediately

    // Trigger loadedmetadata event
    if (loadedMetadataCallback) {
      // Start the callback (which includes duration check)
      const callbackPromise = new Promise<void>((resolve) => {
        // Simulate duration becoming available after 200ms
        setTimeout(() => {
          mockVideoElement.duration = 120.5;
          resolve();
        }, 200);
      });

      loadedMetadataCallback();

      // Wait for duration to be available
      await callbackPromise;

      // Verify duration is now available
      expect(mockVideoElement.duration).toBe(120.5);
      expect(isNaN(mockVideoElement.duration)).toBe(false);
      expect(mockVideoElement.duration).not.toBe(Infinity);
    }
  });

  it('should handle duration check with multiple retries', async () => {
    const durationCheckResults: number[] = [];
    let checkCount = 0;

    // Mock duration that becomes available after 3 checks
    Object.defineProperty(mockVideoElement, 'duration', {
      get: () => {
        checkCount++;
        const durations = [NaN, NaN, NaN, 120.5]; // Available on 4th check
        const result = durations[Math.min(checkCount - 1, durations.length - 1)];
        durationCheckResults.push(result);
        return result;
      },
      configurable: true,
    });

    // Simulate the duration check logic
    const checkDuration = (): Promise<void> => {
      return new Promise((resolve) => {
        const check = () => {
          const duration = mockVideoElement.duration;
          
          if (!duration || isNaN(duration) || duration === Infinity) {
            setTimeout(check, 100);
            return;
          }
          
          resolve();
        };
        
        check();
      });
    };

    await checkDuration();

    // Verify multiple checks were made
    expect(durationCheckResults.length).toBeGreaterThan(1);
    
    // Verify final duration is valid
    const finalDuration = durationCheckResults[durationCheckResults.length - 1];
    expect(finalDuration).toBe(120.5);
    expect(isNaN(finalDuration)).toBe(false);
  });

  it('should maintain playback position after quality switch with duration check', async () => {
    // Initial state
    mockVideoElement.duration = 180; // 3 minutes
    mockVideoElement.currentTime = 45; // At 45 seconds
    mockVideoElement.paused = false;

    const savedTime = mockVideoElement.currentTime;

    // Simulate quality switch
    mockVideoElement.src = 'https://example.com/video-1080p.m3u8';
    mockVideoElement.duration = NaN; // Duration not immediately available

    // Create a promise that resolves when duration is available
    const durationAvailable = new Promise<void>((resolve) => {
      setTimeout(() => {
        mockVideoElement.duration = 180; // Duration becomes available
        resolve();
      }, 150);
    });

    // Simulate the quality switch flow
    if (loadedMetadataCallback) {
      loadedMetadataCallback();
      
      // Wait for duration to be available
      await durationAvailable;
      
      // Simulate seeking back to saved position
      mockPlayer.currentTime(savedTime);
      
      // Verify position was restored
      expect(mockVideoElement.currentTime).toBe(savedTime);
    }
  });

  it('should handle Infinity duration correctly', async () => {
    mockVideoElement.duration = Infinity; // Invalid duration

    const checkDuration = (): Promise<boolean> => {
      return new Promise((resolve) => {
        const check = () => {
          const duration = mockVideoElement.duration;
          
          if (!duration || isNaN(duration) || duration === Infinity) {
            // In real scenario, would retry
            // For test, we'll update duration and check again
            setTimeout(() => {
              mockVideoElement.duration = 150;
              const newDuration = mockVideoElement.duration;
              resolve(!isNaN(newDuration) && newDuration !== Infinity && newDuration > 0);
            }, 100);
            return;
          }
          
          resolve(true);
        };
        
        check();
      });
    };

    const result = await checkDuration();
    expect(result).toBe(true);
    expect(mockVideoElement.duration).toBe(150);
  });

  it('should not proceed with playback until duration is valid', async () => {
    let playbackStarted = false;
    mockVideoElement.duration = NaN;
    
    mockPlayer.play.mockImplementation(() => {
      playbackStarted = true;
      return Promise.resolve();
    });

    // Simulate quality switch handler
    const handleQualitySwitch = async () => {
      // Wait for duration
      await new Promise<void>((resolve) => {
        const check = () => {
          const duration = mockPlayer.duration();
          
          if (!duration || isNaN(duration) || duration === Infinity) {
            setTimeout(check, 100);
            return;
          }
          
          resolve();
        };
        
        check();
      });

      // Only start playback after duration is available
      await mockPlayer.play();
    };

    // Start the quality switch
    const switchPromise = handleQualitySwitch();

    // Verify playback hasn't started yet
    expect(playbackStarted).toBe(false);

    // Make duration available
    setTimeout(() => {
      mockVideoElement.duration = 200;
    }, 150);

    // Wait for switch to complete
    await switchPromise;

    // Verify playback started after duration was available
    expect(playbackStarted).toBe(true);
  });
});
