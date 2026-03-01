import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { HeatService } from '../../services/heat.service';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-heat-manager',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIcon,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
  ],
  templateUrl: './heat-manager.html',
  styleUrls: ['./heat-manager.scss'],
})
export class HeatManager {
  private snackBar = inject(MatSnackBar);
  protected heatService = inject(HeatService);

  athletes = this.heatService.athletes;
  priorityAthleteId = this.heatService.priorityAthleteId;
  isEditingTime = signal(false);
  math = Math; // Para usar no template

  addAndClear(input: HTMLInputElement) {
    if (input.value) {
      this.heatService.addAthlete(input.value);
      input.value = '';
    }
  }

  addScore(athleteId: number, scoreInput: HTMLInputElement) {
    const score = parseFloat(scoreInput.value);
    if (isNaN(score) || score < 0 || score > 10) return;

    this.athletes.update((list) =>
      list.map((a) => {
        if (a.id === athleteId) {
          return { ...a, scores: [...a.scores, score] };
        }
        return a;
      }),
    );

    scoreInput.value = '';
  }

  calculateTotal(scores: number[]): number {
    return [...scores]
      .sort((a, b) => b - a)
      .slice(0, 2)
      .reduce((acc, curr) => acc + curr, 0);
  }

  getTopTwoTotal(scores: number[]): number {
    if (scores.length === 0) return 0;
    const sorted = [...scores].sort((a, b) => b - a);
    return sorted.slice(0, 2).reduce((acc, val) => acc + val, 0);
  }

  handleScore(id: number, input: HTMLInputElement) {
    const val = parseFloat(input.value);
    if (!isNaN(val) && val >= 0 && val <= 10) {
      this.heatService.addScore(id, val);
      input.value = '';
    }
  }

  handleReset() {
    const hasScores = this.heatService.athletes().some((a) => a.scores.length > 0);

    if (hasScores) {
      this.heatService.resetHeat();

      const snack = this.snackBar.open('Bateria zerada!', 'DESFAZER', {
        duration: 8000,
        panelClass: ['warning-snackbar'],
      });

      snack.onAction().subscribe(() => {
        this.heatService.undoReset();
      });
    } else {
      this.heatService.resetHeat();
    }
  }

  isTopScore(score: number, scores: number[], index: number): boolean {
    if (scores.length < 2) return true;

    const indexedScores = scores.map((s, i) => ({ s, i }));
    const topTwo = indexedScores.sort((a, b) => b.s - a.s).slice(0, 2);

    return topTwo.some((item) => item.i === index);
  }

  startEdit() {
    if (!this.heatService.isTimerRunning()) {
      this.isEditingTime.set(true);
    }
  }

  saveTime(value: string) {
    const mins = parseInt(value, 10);
    if (!isNaN(mins)) {
      this.heatService.updateTime(mins);
    }
    this.isEditingTime.set(false);
  }
}
