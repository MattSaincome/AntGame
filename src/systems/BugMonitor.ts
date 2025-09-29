/**
 * Bug Monitoring System - Prevents crashes and detects performance issues
 */

export interface BugReport {
  id: string;
  timestamp: number;
  type: 'infinite_loop' | 'performance' | 'stuck_monster' | 'memory_leak' | 'crash_risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  stackTrace?: string;
  metadata?: any;
}

export class BugMonitor {
  private static instance: BugMonitor;
  private bugs: Map<string, BugReport> = new Map();
  private performanceCounters: Map<string, number> = new Map();
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private isEnabled: boolean = true;

  // Thresholds for detecting issues
  private readonly FRAME_TIME_WARNING = 33; // 33ms = 30fps warning
  private readonly FRAME_TIME_CRITICAL = 66; // 66ms = 15fps critical
  private readonly MAX_STUCK_MONSTERS = 3; // Max monsters that can be stuck simultaneously
  private readonly PERFORMANCE_SAMPLE_SIZE = 60; // Sample 60 frames for average

  static getInstance(): BugMonitor {
    if (!BugMonitor.instance) {
      BugMonitor.instance = new BugMonitor();
    }
    return BugMonitor.instance;
  }

  /**
   * Initialize bug monitoring system
   */
  init(): void {
    console.log('🔧 BugMonitor: Initializing crash prevention system...');
    
    // Monitor for unhandled errors
    window.addEventListener('error', (event) => {
      this.reportBug({
        id: `crash_${Date.now()}`,
        timestamp: Date.now(),
        type: 'crash_risk',
        severity: 'critical',
        description: `Unhandled error: ${event.message}`,
        stackTrace: event.error?.stack,
        metadata: { filename: event.filename, line: event.lineno, col: event.colno }
      });
    });

    // Monitor for promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportBug({
        id: `rejection_${Date.now()}`,
        timestamp: Date.now(),
        type: 'crash_risk',
        severity: 'high',
        description: `Unhandled promise rejection: ${event.reason}`,
        metadata: { reason: event.reason }
      });
    });

    this.lastFrameTime = performance.now();
    console.log('🔧 BugMonitor: Monitoring system active!');
  }

  /**
   * Monitor frame performance to detect lag and potential crashes
   */
  monitorFramePerformance(): void {
    if (!this.isEnabled) return;

    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;
    this.frameCount++;

    // Track performance issues
    if (frameTime > this.FRAME_TIME_CRITICAL) {
      this.reportBug({
        id: `perf_critical_${Date.now()}`,
        timestamp: Date.now(),
        type: 'performance',
        severity: 'critical',
        description: `Critical frame time: ${frameTime.toFixed(2)}ms (${(1000/frameTime).toFixed(1)} FPS)`,
        metadata: { frameTime, fps: 1000/frameTime }
      });
    } else if (frameTime > this.FRAME_TIME_WARNING) {
      this.reportBug({
        id: `perf_warning_${Date.now()}`,
        timestamp: Date.now(),
        type: 'performance',
        severity: 'medium',
        description: `Slow frame detected: ${frameTime.toFixed(2)}ms (${(1000/frameTime).toFixed(1)} FPS)`,
        metadata: { frameTime, fps: 1000/frameTime }
      });
    }

    this.lastFrameTime = currentTime;
  }

  /**
   * Monitor stuck monsters to prevent infinite loops
   */
  monitorStuckMonster(monsterId: string, isStuck: boolean): boolean {
    const key = `stuck_${monsterId}`;
    
    if (isStuck) {
      const count = this.performanceCounters.get('stuck_monsters') || 0;
      
      if (count >= this.MAX_STUCK_MONSTERS) {
        this.reportBug({
          id: `stuck_overload_${Date.now()}`,
          timestamp: Date.now(),
          type: 'infinite_loop',
          severity: 'high',
          description: `Too many stuck monsters (${count + 1}), potential infinite loop detected!`,
          metadata: { stuckCount: count + 1, monsterId }
        });
        
        // EMERGENCY: Disable stuck detection temporarily to prevent crash
        console.warn('🚨 BugMonitor: Emergency - Disabling stuck detection for 30 seconds!');
        this.temporarilyDisableStuckDetection();
        return false; // Don't allow this monster to be marked as stuck
      }
      
      this.performanceCounters.set('stuck_monsters', count + 1);
      this.performanceCounters.set(key, Date.now());
    } else {
      // Monster is no longer stuck
      if (this.performanceCounters.has(key)) {
        const stuckCount = this.performanceCounters.get('stuck_monsters') || 0;
        this.performanceCounters.set('stuck_monsters', Math.max(0, stuckCount - 1));
        this.performanceCounters.delete(key);
      }
    }
    
    return true; // Allow normal stuck detection
  }

  /**
   * Temporarily disable stuck detection to prevent crashes
   */
  private temporarilyDisableStuckDetection(): void {
    this.performanceCounters.set('stuck_detection_disabled', Date.now());
    
    // Re-enable after 30 seconds
    setTimeout(() => {
      this.performanceCounters.delete('stuck_detection_disabled');
      this.performanceCounters.set('stuck_monsters', 0); // Reset counter
      console.log('🔧 BugMonitor: Stuck detection re-enabled');
    }, 30000);
  }

  /**
   * Check if stuck detection is currently disabled
   */
  isStuckDetectionDisabled(): boolean {
    return this.performanceCounters.has('stuck_detection_disabled');
  }

  /**
   * Monitor memory usage (approximation)
   */
  monitorMemoryUsage(objectCount: number, category: string): void {
    if (!this.isEnabled) return;

    const key = `memory_${category}`;
    const previous = this.performanceCounters.get(key) || 0;
    
    // Detect potential memory leaks
    if (objectCount > previous * 1.5 && objectCount > 100) {
      this.reportBug({
        id: `memory_${category}_${Date.now()}`,
        timestamp: Date.now(),
        type: 'memory_leak',
        severity: 'medium',
        description: `Potential memory leak in ${category}: ${objectCount} objects (was ${previous})`,
        metadata: { category, count: objectCount, previous }
      });
    }
    
    this.performanceCounters.set(key, objectCount);
  }

  /**
   * Report a bug to the monitoring system
   */
  private reportBug(bug: BugReport): void {
    if (!this.isEnabled) return;

    this.bugs.set(bug.id, bug);
    
    // Log based on severity
    switch (bug.severity) {
      case 'critical':
        console.error('🔥 CRITICAL BUG:', bug.description, bug.metadata);
        break;
      case 'high':
        console.warn('🚨 HIGH SEVERITY:', bug.description, bug.metadata);
        break;
      case 'medium':
        console.warn('⚠️ MEDIUM:', bug.description);
        break;
      case 'low':
        console.log('ℹ️ LOW:', bug.description);
        break;
    }

    // Auto-cleanup old bugs (keep last 100)
    if (this.bugs.size > 100) {
      const oldestKey = Array.from(this.bugs.keys())[0];
      this.bugs.delete(oldestKey);
    }
  }

  /**
   * Get current performance stats
   */
  getPerformanceStats(): any {
    const avgFrameTime = this.frameCount > 0 ? 
      (performance.now() - this.lastFrameTime) / this.frameCount : 0;
    
    return {
      frameCount: this.frameCount,
      avgFrameTime: avgFrameTime.toFixed(2),
      avgFPS: avgFrameTime > 0 ? (1000 / avgFrameTime).toFixed(1) : 0,
      stuckMonsters: this.performanceCounters.get('stuck_monsters') || 0,
      totalBugs: this.bugs.size,
      isStuckDetectionDisabled: this.isStuckDetectionDisabled()
    };
  }

  /**
   * Get all bug reports
   */
  getBugReports(): BugReport[] {
    return Array.from(this.bugs.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Clear all bugs and reset counters
   */
  reset(): void {
    this.bugs.clear();
    this.performanceCounters.clear();
    this.frameCount = 0;
    console.log('🔧 BugMonitor: System reset');
  }

  /**
   * Enable or disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`🔧 BugMonitor: ${enabled ? 'Enabled' : 'Disabled'}`);
  }
}

// Export singleton instance
export const bugMonitor = BugMonitor.getInstance();
