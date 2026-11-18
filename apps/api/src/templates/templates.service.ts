import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { templates } from '../database/schema';
import { Timeline, AspectRatioPreset } from '@ai-video-studio/video-schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TemplatesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getTemplates() {
    if (this.databaseService.isHealthy) {
      const records = await this.databaseService.db.select().from(templates);
      if (records.length > 0) return records;
    }

    // Default starter templates
    return [
      {
        id: 'tpl-reels-hook',
        name: 'TikTok/Reels Punchy Hook',
        description: '9:16 vertical template with animated title and center frame for high viewer retention.',
        category: 'Social Media',
        thumbnailUrl: null,
        aspectRatio: '9:16',
        timeline: {
          id: 'tpl-reels-hook',
          name: 'TikTok/Reels Hook',
          width: 1080,
          height: 1920,
          fps: 30,
          duration: 15,
          backgroundColor: '#0f172a',
          tracks: [
            {
              id: uuidv4(),
              type: 'video',
              name: 'Main Video',
              index: 0,
              isLocked: false,
              isMuted: false,
              isVisible: true,
              clips: [],
            },
            {
              id: uuidv4(),
              type: 'text',
              name: 'Hook Title',
              index: 1,
              isLocked: false,
              isMuted: false,
              isVisible: true,
              clips: [
                {
                  id: uuidv4(),
                  trackId: 'text-track',
                  name: 'Hook Text',
                  type: 'text',
                  start: 0,
                  duration: 3,
                  transform: { x: 0, y: -200, scale: 1, rotation: 0, opacity: 1, zIndex: 10 },
                  audio: { volume: 1, muted: false, speed: 1, fadeInDuration: 0, fadeOutDuration: 0, pan: 0 },
                  text: {
                    content: 'STOP SCROLLING 🚨',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 64,
                    fontWeight: '900',
                    fontStyle: 'normal',
                    color: '#FFE600',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    textAlign: 'center',
                    padding: 16,
                    borderRadius: 8,
                  },
                  effects: [],
                },
              ],
            },
          ],
          version: 1,
        },
      },
      {
        id: 'tpl-youtube-intro',
        name: '16:9 YouTube Cinematic',
        description: '16:9 widescreen layout with lower third title and cinematic aspect.',
        category: 'YouTube',
        thumbnailUrl: null,
        aspectRatio: '16:9',
        timeline: {
          id: 'tpl-youtube-intro',
          name: '16:9 Cinematic',
          width: 1920,
          height: 1080,
          fps: 30,
          duration: 30,
          backgroundColor: '#000000',
          tracks: [],
          version: 1,
        },
      },
    ];
  }
}

