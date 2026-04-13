import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

type VarianteFondo = 'primary' | 'misty' | 'deep' | 'admin' | 'estudiante';

const VARIANTS = {
  primary: {
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    gradient1: 'bg-emerald-500/40',
    gradient2: 'bg-lime-400/40',
    overlay: 'from-slate-900/20 via-transparent to-slate-900/40'
  },
  misty: {
    image: 'https://images.unsplash.com/photo-1511497584788-876760111969?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    gradient1: 'bg-emerald-400/50',
    gradient2: 'bg-lime-300/50',
    overlay: 'from-slate-950/30 via-slate-950/5 to-slate-950/50'
  },
  deep: {
    image: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    gradient1: 'bg-primary-500/40',
    gradient2: 'bg-accent-neon/40',
    overlay: 'from-slate-950/40 via-transparent to-slate-950/60'
  },
  admin: {
    image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    gradient1: 'bg-emerald-600/30',
    gradient2: 'bg-slate-700/40',
    overlay: 'from-slate-950/50 via-slate-950/30 to-slate-950/60'
  },
  estudiante: {
    image: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    gradient1: 'bg-emerald-900/40',
    gradient2: 'bg-primary-900/40',
    overlay: 'from-slate-950/80 via-slate-950/40 to-slate-950/80'
  }
};

@Component({
  selector: 'app-fondo-visual',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-0 bg-slate-950 overflow-hidden">
        <div class="absolute inset-0 animate-fade-in-slow">
            <!-- High-res Nature Image with Parallax & Blur -->
            <div class="absolute inset-0 animate-scale-down-slow">
                <img
                    [src]="configuracion.image"
                    alt="Nature Background"
                    class="w-full h-full object-cover grayscale-[0.2] contrast-[1.1]"
                />
                <div class="absolute inset-0 bg-gradient-to-b" [ngClass]="configuracion.overlay"></div>
            </div>

            <!-- Mesh Gradients Overlay -->
            <div class="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none">
                <div class="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[150px] animate-pulse" [ngClass]="configuracion.gradient1"></div>
                <div class="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] rounded-full blur-[150px] animate-pulse delay-1000" [ngClass]="configuracion.gradient2"></div>
            </div>
        </div>

        <!-- Particles Overlay -->
        <div class="particles-container pointer-events-none"></div>
    </div>
  `,
  styles: [`
    @keyframes fadeInSlow {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleDownSlow {
      from { transform: scale(1.1); }
      to { transform: scale(1); }
    }
    .animate-fade-in-slow {
      animation: fadeInSlow 1.5s ease-in-out forwards;
    }
    .animate-scale-down-slow {
      animation: scaleDownSlow 10s linear forwards;
    }
    .particles-container {
      position: absolute;
      inset: 0;
      background-image: 
        radial-gradient(circle at 20% 30%, rgba(34, 197, 94, 0.4) 1px, transparent 1px),
        radial-gradient(circle at 70% 60%, rgba(190, 242, 100, 0.4) 1px, transparent 1px),
        radial-gradient(circle at 40% 80%, rgba(255, 255, 255, 0.3) 1px, transparent 1px);
      background-size: 150px 150px;
      opacity: 0.6;
      animation: floatParticles 30s linear infinite;
    }
    @keyframes floatParticles {
      0% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-50px) rotate(180deg); }
      100% { transform: translateY(0) rotate(360deg); }
    }
  `]
})
export class FondoVisualComponent implements OnInit {
  @Input() variante: VarianteFondo = 'primary';

  configuracion = VARIANTS['primary'];

  ngOnInit() {
    this.configuracion = VARIANTS[this.variante] || VARIANTS['primary'];
  }
}

