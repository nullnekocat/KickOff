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

  showModal = false;
  newText = '';
  selectedUser = '';

  constructor(
    private taskService: TaskService,
    private socketService: SocketService,
    private chatSelection: ChatSelectionService
  ) { }

  ngOnInit() {
    this.currentUserId = localStorage.getItem('userId') || '';

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

    this.socketService.onToggleTask(task => {
      const i = this.tareas.findIndex(t => t._id === task._id);
      if (i !== -1) this.tareas[i] = task;
    });

    this.socketService.onDeleteTask(taskId => {
      this.tareas = this.tareas.filter(t => t._id !== taskId);
    });
  }

  loadTasks() {
    if (!this.groupId) return;

    this.taskService.getTasks(this.groupId).subscribe({
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
        this.tareas.push(task);
        this.socketService.createTaskSocket(task);
      });
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
    this.taskService.deleteTask(task._id).subscribe(() => {
      this.tareas = this.tareas.filter(t => t._id !== task._id);
      this.socketService.deleteTaskSocket(task._id);
    });
  }

}
