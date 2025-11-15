import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ChatSelectionService } from '../../services/chat-selection.service';
import { TaskService } from '../../services/task.service';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-tareas',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './tareas.html',
  styleUrl: './tareas.css'
})
export class Tareas {

  tareas: any[] = [];
  members: any[] = [];
  groupId = '';
  currentUserId = '';
  showHidden = false;

  showModal = false;
  newText = '';
  selectedUser = '';
  private cachedVisibleTareas: any[] = [];

  constructor(
    private taskService: TaskService,
    private socketService: SocketService,
    private chatSelection: ChatSelectionService
  ) { }

  ngOnInit() {
    this.currentUserId = localStorage.getItem('currentUserId') || '';
    //console.log(this.currentUserId);

    this.chatSelection.selected$.subscribe(chat => {
      if (!chat || chat.type !== 'grupo') {
        this.tareas = [];
        this.members = [];
        this.groupId = '';
        return;
      }

      this.groupId = chat.id;
      this.members = chat.members || [];
      this.loadTasks();
    });

    // SOCKET LISTENERS
    this.socketService.onNewTask(task => {
      if (task.groupId === this.groupId) {
        this.tareas.push(task);
      }
    });

    this.socketService.onHideTask((task: any) => {
      if (task.groupId !== this.groupId) return;

      if (task.hidden) {
        this.tareas = this.tareas.filter(t => t._id !== task._id);
        this.cachedVisibleTareas = this.cachedVisibleTareas.filter(t => t._id !== task._id);
      } else {
        if (this.showHidden) {
          this.tareas = this.tareas.filter(t => t._id !== task._id);
        }

        if (!this.cachedVisibleTareas.some((t: any) => t._id === task._id)) {
          this.cachedVisibleTareas.push(task);
        }

        if (!this.showHidden) {
          this.tareas.push(task);
        }
      }
    });

    this.socketService.onToggleTask(task => {
      const i = this.tareas.findIndex(t => t._id === task._id);
      if (i !== -1) this.tareas[i] = task;
    });

    this.socketService.onDeleteTask(taskId => {
      this.tareas = this.tareas.filter(t => t._id !== taskId);
    });
  }

  isAssignedToCurrentUser(inChargeId: string): boolean {
    return inChargeId === this.currentUserId;  
  }

  loadTasks() {
    if (!this.groupId) return;

    this.taskService.getTasks(this.groupId).subscribe({
      next: (tasks: any) => {
        this.tareas = tasks;
        this.cachedVisibleTareas = [...tasks];
      }
    });
  }

  loadHiddenTasks() {
    if (!this.groupId) return;
    this.taskService.getHiddenTasks(this.groupId).subscribe({
      next: (tasks: any) => this.tareas = tasks
    });
  }

  openModal() {
    this.newText = '';
    this.selectedUser = '';
    this.showModal = true;
  }

  createTask() {
    if (!this.newText.trim() || !this.selectedUser) return;

    this.taskService.createTask(this.newText, this.selectedUser, this.groupId)
      .subscribe((task: any) => {
        this.showModal = false;
        // optimistic
        this.tareas.push(task);
        if (!this.showHidden) this.cachedVisibleTareas.push(task);
        this.socketService.createTaskSocket(task);
      });
  }

  // Ocultar una tarea (no borrarla)
  hideTask(task: any) {
    const shouldHide = true;
    this.taskService.hideTask(task._id, shouldHide).subscribe((updated: any) => {
      this.tareas = this.tareas.filter(t => t._id !== updated._id);
      this.cachedVisibleTareas = this.cachedVisibleTareas.filter(t => t._id !== updated._id);
      // optimistic
      this.socketService.hideTaskSocket(updated);
    });
  }

  // Desocultar una tarea
  unhideTask(task: any) {
    const shouldHide = false;
    this.taskService.hideTask(task._id, shouldHide).subscribe((updated: any) => {
      if (this.showHidden) this.tareas = this.tareas.filter(t => t._id !== updated._id);

      if (!this.cachedVisibleTareas.some((t: any) => t._id === updated._id)) {
        this.cachedVisibleTareas.push(updated);
      }
      if (!this.showHidden) this.tareas.push(updated);

      this.socketService.hideTaskSocket(updated);
    });
  }

  toggleShowHidden() {
    this.showHidden = !this.showHidden;
    if (this.showHidden) this.loadHiddenTasks();
    else this.loadTasks();
  }

  toggleCompleted(task: any) {
    if (task.inChargeId._id !== this.currentUserId) return;

    this.taskService.toggleCompleted(task._id)
      .subscribe((updatedTask: any) => {
        const i = this.tareas.findIndex(t => t._id === updatedTask._id);
        if (i !== -1) this.tareas[i] = updatedTask;
        this.socketService.toggleTaskSocket(updatedTask);
      });
  }

  deleteTask(task: any) {
    // Only allow deletion from the hidden list in UI
    if (!this.showHidden) return;
    this.taskService.deleteTask(task._id).subscribe(() => {
      this.tareas = this.tareas.filter(t => t._id !== task._id);
      this.socketService.deleteTaskSocket(task._id);
    });
  }

}
