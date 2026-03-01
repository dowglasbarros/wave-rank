import { Injectable, signal, effect, computed } from '@angular/core';
import { Athlete } from '../interfaces/surfer';

@Injectable({
  providedIn: 'root',
})
export class HeatService {
  private readonly STORAGE_KEY = 'surf_heat_data';
  private snapshotBeforeReset: Athlete[] | null = null;

  athletes = signal<Athlete[]>(this.loadFromStorage());
  priorityAthleteId = signal<number | null>(null);

  constructor() {
    effect(() => {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.athletes()));
    });
  }

  ngOnDestroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  addAthlete(name: string) {
    if (!name.trim()) return;

    const newAthlete: Athlete = {
      id: Date.now(),
      name: name,
      scores: [],
    };

    this.athletes.update((list) => [...list, newAthlete]);
  }

  addScore(athleteId: number, score: number) {
    this.athletes.update((list) =>
      list.map((a) => (a.id === athleteId ? { ...a, scores: [...a.scores, score] } : a)),
    );
  }

  private loadFromStorage(): Athlete[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data
      ? JSON.parse(data)
      : [
          { id: 1, name: 'Dowglas Barros', scores: [] },
          { id: 2, name: 'Italo Ferreira', scores: [] },
          { id: 3, name: 'Gabriel Medina', scores: [] },
        ];
  }

  removeAthlete(id: number) {
    this.athletes.update((list) => list.filter((a) => a.id !== id));
    if (this.priorityAthleteId() === id) {
      this.priorityAthleteId.set(null);
    }
  }

  resetHeat() {
    this.snapshotBeforeReset = JSON.parse(JSON.stringify(this.athletes()));
    this.athletes.update((list) => list.map((a) => ({ ...a, scores: [] })));
  }

  undoReset() {
    if (this.snapshotBeforeReset) {
      this.athletes.set(this.snapshotBeforeReset);
      this.snapshotBeforeReset = null;
    }
  }

  setPriority(id: number) {
    this.priorityAthleteId.set(id);
  }

  readonly rankedAthletes = computed(() => {
    const list = [...this.athletes()];

    return list.sort((a, b) => {
      const scoreA = this.calculateTotal(a.scores);
      const scoreB = this.calculateTotal(b.scores);

      if (scoreB === scoreA) {
        const bestA = Math.max(...a.scores, 0);
        const bestB = Math.max(...b.scores, 0);
        return bestB - bestA;
      }

      return scoreB - scoreA;
    });
  });

  calculateTotal(scores: number[]): number {
    if (!scores.length) return 0;
    return [...scores]
      .sort((a, b) => b - a)
      .slice(0, 2)
      .reduce((acc, curr) => acc + curr, 0);
  }

  readonly requirements = computed(() => {
    const ranked = this.rankedAthletes();
    if (ranked.length < 2) return new Map<number, string>();

    const leaderTotal = this.calculateTotal(ranked[0].scores);
    const requirementsMap = new Map<number, string>();

    ranked.forEach((athlete, index) => {
      if (index === 0) {
        requirementsMap.set(athlete.id, 'LÍDER');
        return;
      }

      const bestSingleScore = Math.max(...athlete.scores, 0);

      const needed = leaderTotal - bestSingleScore + 0.01;

      if (needed > 10) {
        requirementsMap.set(athlete.id, 'Combo (2 ondas)');
      } else if (needed <= 0) {
        requirementsMap.set(athlete.id, '0.01');
      } else {
        requirementsMap.set(athlete.id, needed.toFixed(2));
      }
    });

    return requirementsMap;
  });

  readonly timeLeft = signal<number>(20 * 60);
  readonly isTimerRunning = signal<boolean>(false);
  private timerId: any;

  toggleTimer() {
    if (this.isTimerRunning()) {
      clearInterval(this.timerId);
      this.isTimerRunning.set(false);
    } else {
      this.isTimerRunning.set(true);
      this.timerId = setInterval(() => {
        this.timeLeft.update((t) => {
          if (t <= 0) {
            this.toggleTimer();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
  }

  readonly formattedTime = computed(() => {
    const minutes = Math.floor(this.timeLeft() / 60);
    const seconds = this.timeLeft() % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });

  updateTime(minutes: number) {
    const seconds = Math.max(0, minutes * 60);
    this.timeLeft.set(seconds);
  }

  resetTimer() {
    this.updateTime(20);
    this.isTimerRunning.set(false);
  }

  removeScore(athleteId: number, scoreIndex: number) {
    this.athletes.update((list) =>
      list.map((a) => {
        if (a.id === athleteId) {
          const newScores = [...a.scores];
          newScores.splice(scoreIndex, 1);
          return { ...a, scores: newScores };
        }
        return a;
      }),
    );
  }
}
