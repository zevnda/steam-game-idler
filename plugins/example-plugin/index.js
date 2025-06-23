
// Example Plugin Main File
class ExamplePlugin {
    constructor() {
        this.name = "Example Plugin";
        this.version = "1.0.0";
    }

    async init() {
        console.log("Example Plugin initialized");
        return { success: true, message: "Plugin loaded successfully" };
    }

    async handleCommand(command, args) {
        switch (command) {
            case "hello":
                return { message: `Hello from ${this.name}!`, args };
            case "get_data":
                return await this.getData();
            default:
                return { error: `Unknown command: ${command}` };
        }
    }

    async getData() {
        // Example of accessing app APIs
        try {
            const games = await window.__TAURI__.invoke('get_games_list');
            return { games: games.slice(0, 5) }; // Return first 5 games
        } catch (error) {
            return { error: error.toString() };
        }
    }

    onGameCardContextMenu(game) {
        return {
            action: "show_notification",
            message: `Example action for ${game.name}`
        };
    }
}

// Export the plugin
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExamplePlugin;
} else {
    window.ExamplePlugin = ExamplePlugin;
}
