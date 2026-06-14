import {
  Component,
  Input,
  ViewChild,
  ViewContainerRef,
  OnChanges,
  AfterViewInit,
} from '@angular/core'

@Component({
  selector: 'csti-preview',
  standalone: true,
  template: `<ng-container #host></ng-container>`,
})
export class CstiPreviewComponent implements OnChanges, AfterViewInit {
  @Input() tpl = ''
  @ViewChild('host', { read: ViewContainerRef, static: true }) host!: ViewContainerRef

  ngAfterViewInit() {
    this.render()
  }
  ngOnChanges() {
    this.render()
  }

  // VULN[ng-jit-csti] — a user-controlled string is compiled into a component
  // template at runtime (JIT, enabled by importing @angular/compiler). Angular
  // template expressions read identifiers from the component context with no
  // sandbox, so {{constructor.constructor('alert(1)')()}} reaches Function() and
  // executes.
  private render() {
    if (!this.host) return
    const Dyn = (Component as any)({
      template: `<div class="body">${this.tpl}</div>`,
      standalone: true,
    })(class {})
    this.host.clear()
    try {
      this.host.createComponent(Dyn)
    } catch (e) {
      console.error('csti compile error', e)
    }
  }
}
