define(function(require)
{
	var _        = require('underscore');
	var $        = require('jquery');
	var Backbone = require('backbone');
	var Template = require('text!templates/game_editor.tpl');

	var MediaCollection  = require('collections/media');
	var MediaChooserView = require('views/media_chooser');
	var AlertDialog      = require('views/alert_dialog');

	var Game = require('models/game');
	var vent = require('vent');

	return Backbone.Marionette.CompositeView.extend({

		/* View */

		template: _.template(Template),

		className: "games-list-container",

		templateHelpers: function() {
			return {
				is_new : this.model.isNew(),
				icon_thumbnail_url:  this.icon.thumbnail_for(this.model),
				media_thumbnail_url: this.media.thumbnail_for(),

				option_selected: function(boolean_statement) {
					return boolean_statement ? "selected" : "";
				},

				is_checked: function(value) {
					return value === "1" ? "checked" : "";
				},

				radio_selected: function(boolean_statement) {
					return boolean_statement ? "checked" : "";
				},

				tab_selected: function(boolean_statement) {
					return boolean_statement ? "active" : "";
				},

				tab_visible: function(boolean_statement) {
					return boolean_statement ? "" : "style='display: none;'";
				},

				scenes: this.scenes
			};
		},

		ui: {
			"save":   ".save",
			"delete": ".delete",
			"cancel": ".cancel",

			"change_icon":  ".change-icon",
			"change_media": ".change-media",
			"game_published": ".game-published",

			"name":        "#game-name",
			"description": "#game-description",
			"type":        "#game-type",
			"intro_scene": "#game-intro_scene_id",

			"map_type":         "#game-map_type",
			"map_latitude":     "#game-map_latitude",
			"map_longitude":    "#game-map_longitude",
			"map_zoom_level":   "#game-map_zoom_level",
			"map_show_player":  "#game-map_show_player",
			"map_show_players": "#game-map_show_players",
			"map_offsite_mode": "#game-map_offsite_mode",

			"notebook_allow_comments":    "#game-notebook_allow_comments",
			"notebook_allow_likes":       "#game-notebook_allow_likes",

			"inventory_weight_cap": "#game-inventory_weight_cap",

			"icon":  ".change-icon img",
			"media": ".change-media img",

			"autofocus":  "input[autofocus]"
		},


		/* Dom manipulation */

		set_icon: function(media) {
			this.ui.icon.attr("src", media.thumbnail_for(this.model));
		},

		set_media: function(media) {
			this.ui.media.attr("src", media.thumbnail_for());
		},

		onShow: function() {
			this.ui.autofocus.focus();
		},


		/* Initialization and Rendering */

		initialize: function(options) {
			this.icon   = this.model.icon();
			this.media  = this.model.media();
			this.scenes = options.scenes;

			/* Icon media change events */

			this.bindIconAssociation();
		},

		onRender: function() {
			this.$el.find('[data-toggle="popover"]').popover({trigger: 'hover',placement: 'top', delay: 400 });
		},


		/* View Events */

		events: {
			"click @ui.save":   "onClickSave",
			"click @ui.cancel": "onClickCancel",
			"click @ui.delete": "onClickDelete",

			"click @ui.change_icon":  "onClickIcon",
			"click @ui.change_media": "onClickMedia",

			"change @ui.game_published": "onChangePublished"
		},


		/* Crud */

		onClickSave: function() {
			var view = this;

			this.model.set("name",           this.ui.name.val());
			this.model.set("description",    this.ui.description.val());
			this.model.set("published",      this.$el.find(".game-published:checked").val());
			this.model.set("intro_scene_id", this.ui.intro_scene.val());

			this.model.set("type", this.ui.type.val());

			this.model.set("icon_media_id", this.icon.id);
			this.model.set("media_id",      this.media.id);

			this.model.set("map_type",         this.ui.map_type.val());
			this.model.set("map_latitude",     this.ui.map_latitude.val());
			this.model.set("map_longitude",    this.ui.map_longitude.val());
			this.model.set("map_zoom_level",   this.ui.map_zoom_level.val());
			this.model.set("map_show_player",  this.ui.map_show_player.is(":checked") ? "1" : "0");
			this.model.set("map_show_players", this.ui.map_show_players.is(":checked") ? "1" : "0");
			this.model.set("map_offsite_mode", this.ui.map_offsite_mode.is(":checked") ? "1" : "0");

			this.model.set("notebook_allow_comments",    this.ui.notebook_allow_comments.is(":checked") ? "1" : "0");
			this.model.set("notebook_allow_likes",       this.ui.notebook_allow_likes.is(":checked") ? "1" : "0");
			this.model.set("inventory_weight_cap",       this.ui.inventory_weight_cap.val());

			this.model.save({}, {
				update: function() {
					Backbone.history.navigate("#games/"+view.model.get('game_id')+"/scenes", {trigger: true});
				}
			});
		},

		onClickCancel: function() {
			Backbone.history.navigate("#games/"+this.model.get('game_id')+"/scenes", {trigger: true});
		},

		onClickDelete: function() {
			var view = this;

			var alert_dialog = new AlertDialog({text: "Are you sure you want to delete this game? All data will be lost.", danger_button: true, cancel_button: true});

			alert_dialog.on("danger", function() {
				view.model.destroy({
					success: function() {
						Backbone.history.navigate("#games", {trigger: true});
					}
				});
				vent.trigger("application:popup:hide");
			});

			alert_dialog.on("cancel", function() {
				vent.trigger("application:popup:hide");
			});

			vent.trigger("application:popup:show", alert_dialog, "Delete Game?");
		},

		/* Association Binding */

		unbindIconAssociation: function() {
			this.stopListening(this.icon);
			this.stopListening(this.media);
		},

		bindIconAssociation: function() {
			this.listenTo(this.icon,  'change', this.set_icon);
			this.listenTo(this.media, 'change', this.set_media);
		},


		/* Radio Logic */

		onChangePublished: function() {
			var view = this;

			// Hide radio buttons and add bootstrap classes
			//
			var selected_radio = this.$el.find(".game-published:checked");

			this.$el.find(".game-published").parent().removeClass("active");
			selected_radio.parent().addClass("active");
		},


		/* Media Selectors */

		onClickIcon: function(event) {
			var view = this;
			event.preventDefault();

			var media = new MediaCollection([], {parent: this.model});

			media.fetch({
				success: function() {
					/* Add default */
					media.unshift(view.model.default_icon());

					/* Icon */
					var icon_chooser = new MediaChooserView({collection: media, selected: view.icon, context: view.model});
					vent.trigger("application:popup:show", icon_chooser, "Game Icon");

					icon_chooser.on("media:choose", function(media) {
						view.unbindIconAssociation();
						view.icon = media;
						view.bindIconAssociation();
						view.set_icon(media);
						vent.trigger("application:popup:hide");
					});

					icon_chooser.on("cancel", function() {
						vent.trigger("application:popup:hide");
					});
				}
			});
		},

		onClickMedia: function(event) {
			var view = this;
			event.preventDefault();

			var media = new MediaCollection([], {parent: this.model});

			media.fetch({
				success: function() {
					/* Add default */
					media.unshift(view.model.default_icon());

					/* Icon */
					var icon_chooser = new MediaChooserView({collection: media, selected: view.media});

					vent.trigger("application:popup:show", icon_chooser, "Game Media");

					icon_chooser.on("media:choose", function(media) {
						view.unbindIconAssociation();
						view.media = media;
						view.bindIconAssociation();
						view.set_media(media);
						vent.trigger("application:popup:hide");
					});

					icon_chooser.on("cancel", function() {
						vent.trigger("application:popup:hide");
					});
				}
			});
		}

	});
});

