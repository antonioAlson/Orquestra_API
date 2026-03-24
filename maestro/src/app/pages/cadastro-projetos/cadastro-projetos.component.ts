import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cadastro-projetos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cadastro-projetos.component.html',
  styleUrl: './cadastro-projetos.component.scss'
})
export class CadastroProjetosComponent implements OnInit {
  
  constructor() {}

  ngOnInit(): void {
    console.log('CadastroProjetosComponent inicializado');
  }
}
