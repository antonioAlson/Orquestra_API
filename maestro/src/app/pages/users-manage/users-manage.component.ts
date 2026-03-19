import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, take } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

interface ManagedUser {
  id: number;
  name: string;
  email: string;
  createdAt?: string;
}

@Component({
  selector: 'app-users-manage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-manage.component.html',
  styleUrl: './users-manage.component.scss'
})
export class UsersManageComponent implements OnInit {
  users: ManagedUser[] = [];
  filteredUsers: ManagedUser[] = [];
  searchTerm = '';
  isLoading = false;
  isSaving = false;
  showCreateModal = false;
  feedbackMessage = '';
  feedbackType: 'success' | 'error' | '' = '';

  formName = '';
  formEmail = '';
  formPassword = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.feedbackMessage = '';
    this.feedbackType = '';

    this.authService.listUsers()
      .pipe(
        take(1),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.users = response.data?.users || [];
          this.applySearch();
        },
        error: (error) => {
          this.users = [];
          this.filteredUsers = [];
          this.feedbackType = 'error';
          this.feedbackMessage = error?.error?.message || 'Erro ao carregar usuários';
        }
      });
  }

  applySearch(): void {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredUsers = [...this.users];
      return;
    }

    this.filteredUsers = this.users.filter(user => {
      const name = (user.name || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const id = String(user.id || '');
      return name.includes(term) || email.includes(term) || id.includes(term);
    });
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.formName = '';
    this.formEmail = '';
    this.formPassword = '';
    this.feedbackMessage = '';
    this.feedbackType = '';
  }

  closeCreateModal(): void {
    if (this.isSaving) {
      return;
    }

    this.showCreateModal = false;
  }

  canSubmitCreateUser(): boolean {
    return this.formName.trim().length > 0
      && this.formEmail.trim().length > 0
      && this.formPassword.length >= 6
      && !this.isSaving;
  }

  createUser(): void {
    if (!this.canSubmitCreateUser()) {
      return;
    }

    this.isSaving = true;
    this.feedbackMessage = '';
    this.feedbackType = '';

    this.authService.createManagedUser(this.formName.trim(), this.formEmail.trim(), this.formPassword)
      .pipe(
        take(1),
        finalize(() => {
          this.isSaving = false;
        })
      )
      .subscribe({
        next: (response) => {
          const createdUser = response.data?.user;
          if (createdUser) {
            this.users = [createdUser as ManagedUser, ...this.users];
            this.applySearch();
          }

          this.feedbackType = 'success';
          this.feedbackMessage = response.message || 'Usuário criado com sucesso';

          setTimeout(() => {
            this.showCreateModal = false;
          }, 700);
        },
        error: (error) => {
          this.feedbackType = 'error';
          this.feedbackMessage = error?.error?.message || 'Erro ao criar usuário';
        }
      });
  }

  formatDate(date?: string): string {
    if (!date) {
      return '-';
    }

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return '-';
    }

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(parsed);
  }
}
