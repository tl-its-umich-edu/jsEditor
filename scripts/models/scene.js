define(function(require)
{
	var JsonBaseModel = require('models/json_base');
	var storage       = require('storage');

	return JsonBaseModel.extend({
		idAttribute: 'scene_id',

		amfphp_url_templates: {
			read:   "scenes.getScene",
			update: "scenes.updateScene",
			create: "scenes.createScene",
			delete: "scenes.deleteScene"
		},

		amfphp_url_attributes: [
			"scene_id",
			"name",
			"game_id"
        ],

		defaults: {
			name: ""
		},


		/* Associations */
		game: function() {
			return storage.games.retrieve(this.get('game_id'));
		},


		/* Make trigger editor happy */

		default_icon: function() {
			return storage.media.retrieve('0');
		},

		icon: function() {
			return this.default_icon();
		},

		icon_thumbnail: function() {
			return this.icon().thumbnail_for(this);
		},
	});
});

