// Example Plugin Main Script
console.log('Example plugin loaded!')

// Plugin lifecycle hooks
function init(context) {
  console.log('Example plugin initialized with context:', context)
  return {
    status: 'success',
    message: 'Example plugin initialized successfully',
  }
}

function enable(context) {
  console.log('Example plugin enabled')
  return {
    status: 'success',
    message: 'Example plugin enabled',
  }
}

function disable(context) {
  console.log('Example plugin disabled')
  return {
    status: 'success',
    message: 'Example plugin disabled',
  }
}

// Context menu handler
function context_menu_action(args) {
  const { menuItemId, context, game } = args

  console.log(`Context menu action: ${menuItemId} in ${context} for game:`, game)

  if (menuItemId === 'example-context-menu') {
    return {
      status: 'success',
      message: `Example action executed for ${game.name}`,
    }
  }

  return {
    status: 'error',
    message: 'Unknown context menu action',
  }
}

// Export functions for the plugin system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    init,
    enable,
    disable,
    context_menu_action,
  }
}
