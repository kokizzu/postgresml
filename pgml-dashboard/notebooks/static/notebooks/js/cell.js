import { Controller } from '@hotwired/stimulus'

export default class extends Controller {
  static targets = [
    'editor',
    'form',
    'undo',
    'play',
    'type',
  ];

  connect() {
    // Enable CodeMirror editor if we are editing.
    if (this.hasEditorTarget && this.hasFormTarget) {
      this.initCodeMirrorOnTarget(this.editorTarget)
    }

    // Delete the frame in 10 seconds.
    if (this.hasUndoTarget) {
      setTimeout(function() {
        // I think undoTarget is preserved after reload, not sure
        if (this.hasUndoTarget && this.undoTarget.parentNode) {
          this.undoTarget.parentNode.remove()
        }
      }.bind(this), 10000)
    }
  }

  // Enable CodeMirror on target.
  initCodeMirrorOnTarget(target) {
    this.codeMirror = CodeMirror.fromTextArea(target, {
      lineWrapping: true,
      matchBrackets: true,
      mode: 'sql',
      scrollbarStyle: 'null',
    })

    this.codeMirror.setSize('100%', 250)

    const keyMap = {
      'Ctrl-Enter': () => this.formTarget.requestSubmit(),
      'Cmd-Enter': () => this.formTarget.requestSubmit(),
      'Ctrl-/': () => this.codeMirror.execCommand('toggleComment'),
      'Cmd-/': () => this.codeMirror.execCommand('toggleComment'),
    };

    this.codeMirror.addKeyMap(keyMap)

    this.selectCellType()
  }

  // Change syntax highlighting.
  selectCellType(event) {
    const value = this.typeTarget.options[this.typeTarget.selectedIndex].value

    if (value == 3) {
      this.codeMirror.setOption('mode', 'sql')
    } else {
      this.codeMirror.setOption('mode', 'gfm')
    }
  }

  // Prevent the page from scrolling up
  // and scroll it manually to the bottom
  // on form submit.
  freezeScrollOnNextRender() {
    document.addEventListener('turbo:render', scrollToBottom);
  }

  // Disable cell until execution completes.
  // Prevents duplicate submits.
  play(event) {
    this.playTarget.querySelector('span').innerHTML = 'pending'
    this.playTarget.disabled = true

    if (this.codeMirror) {
      const disableKeyMap = {
        'Ctrl-Enter': () => null,
        'Cmd-Enter': () => null,
        'Ctrl-/': () => null,
        'Cmd-/': () => null,
      };

      this.codeMirror.setOption('readOnly', true)
      this.codeMirror.addKeyMap(disableKeyMap)
    }
  }
}

const scrollToBottom = () => {
  window.Turbo.navigator.currentVisit.scrolled = true;
  window.scrollTo(0, document.body.scrollHeight)
  document.removeEventListener('turbo:render', scrollToBottom);
};