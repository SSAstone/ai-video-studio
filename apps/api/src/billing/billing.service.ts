import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { workspaces, creditTransactions, plans, subscriptions } from '../database/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async getPlans() {
    if (this.databaseService.isHealthy) {
      return this.databaseService.db.select().from(plans);
    }
    return [
      {
        id: 'plan-free',
        name: 'Starter Free',
        code: 'free',
        monthlyCredits: 100,
        maxResolution: '1080p',
        maxStorageMb: 2000,
        priceMonthlyCents: 0,
        features: ['1080p Export', 'Basic AI Tools', '100 Monthly Credits', '2GB Storage'],
      },
      {
        id: 'plan-pro',
        name: 'Pro Creator',
        code: 'pro',
        monthlyCredits: 1000,
        maxResolution: '4k',
        maxStorageMb: 50000,
        priceMonthlyCents: 1900,
        features: ['4K Ultra HD Export', 'Unlimited AI Edit Plans', 'Auto Subtitles', '50GB Storage', 'Priority Worker Queue'],
      },
    ];
  }

  async getCreditBalance(workspaceId: string): Promise<number> {
    if (this.databaseService.isHealthy) {
      const [ws] = await this.databaseService.db
        .select({ balance: workspaces.creditBalance })
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1);
      return ws?.balance || 0;
    }
    return 100;
  }

  async deductCredits(workspaceId: string, amount: number, description: string, referenceId?: string): Promise<boolean> {
    if (amount <= 0) return true;

    if (this.databaseService.isHealthy) {
      return this.databaseService.db.transaction(async (tx: any) => {
        const [ws] = await tx
          .select({ balance: workspaces.creditBalance })
          .from(workspaces)
          .where(eq(workspaces.id, workspaceId))
          .limit(1);

        if (!ws || ws.balance < amount) {
          throw new BadRequestException('Insufficient credits for this operation');
        }

        const newBalance = ws.balance - amount;

        await tx
          .update(workspaces)
          .set({ creditBalance: newBalance, updatedAt: new Date() })
          .where(eq(workspaces.id, workspaceId));

        await tx.insert(creditTransactions).values({
          id: uuidv4(),
          workspaceId,
          amount: -amount,
          balanceAfter: newBalance,
          type: 'render_deduction',
          description,
          referenceId: referenceId as any,
        });

        return true;
      });
    }

    return true;
  }

  async addCredits(workspaceId: string, amount: number, description: string): Promise<number> {
    if (this.databaseService.isHealthy) {
      return this.databaseService.db.transaction(async (tx: any) => {
        const [ws] = await tx
          .select({ balance: workspaces.creditBalance })
          .from(workspaces)
          .where(eq(workspaces.id, workspaceId))
          .limit(1);

        const newBalance = (ws?.balance || 0) + amount;

        await tx
          .update(workspaces)
          .set({ creditBalance: newBalance, updatedAt: new Date() })
          .where(eq(workspaces.id, workspaceId));

        await tx.insert(creditTransactions).values({
          id: uuidv4(),
          workspaceId,
          amount,
          balanceAfter: newBalance,
          type: 'manual_add',
          description,
        });

        return newBalance;
      });
    }

    return 100 + amount;
  }
}
