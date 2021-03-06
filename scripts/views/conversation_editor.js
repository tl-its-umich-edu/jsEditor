define([
	'underscore',
	'panzoom',
	'backbone',
	'text!templates/conversation_editor.tpl',
	'views/conversation_script',
	'models/dialog_script',
	'models/dialog_option',
	'models/character',
	'models/media',
	'collections/dialog_options',
	'vent'
], function(_, $panzoom, Backbone, Template, ConversationScriptView, DialogScript, DialogOption, Character, Media, DialogOptionsCollection, vent) {
	return Backbone.Marionette.ItemView.extend({
		template: _.template(Template),

		templateHelpers: function() {
			return {
				no_intro_script: !this.model
			}
		},

		className: 'conversation-editor',

		ui: {
			intro_script_region: '.intro_script_region'
		},

		events: {
			'click .add-intro-script': "onClickNew"
		},

		initialize: function(options) {
			this.incoming_options = options;
			this.game   = options.game;
			this.dialog = options.dialog;

			vent.on("conversation:update", this.render);
		},

		onRender: function() {
			var view = this;

			// re-wire up children, characters, and media
			this.incoming_options.scripts.each(function(script)
			{
				// Flag to prevent infinitely recursive rendering
				script.set("rendered", false);

				var script_options = view.incoming_options.script_options.where({parent_dialog_script_id: script.id});

				script_options.sort(function(a,b){ if(parseInt(a.get("sort_index")) < parseInt(b.get("sort_index"))) return -1; if(parseInt(a.get("sort_index")) > parseInt(b.get("sort_index"))) return 1; return 0; });

				//Normalizes sort_indexes, adds property of first/last for rendering
				for(var i = 0; i < script_options.length; i++)
				{
					var oldindex = script_options[i].get("sort_index");
					script_options[i].set("sort_index",i);

					if(oldindex != script_options[i].get("sort_index")) script_options[i].save();

					script_options[i].firstOption = false;
					script_options[i].lastOption = false;
				}
				if(script_options.length > 0)
				{
					script_options[0].firstOption = true;
					script_options[script_options.length-1].lastOption = true;
				}

				script.set("dialog_options", new DialogOptionsCollection(script_options));

				var character = view.incoming_options.characters.findWhere({dialog_character_id: script.get("dialog_character_id")});
				script.set("character", character);
			});

			if(this.model) {
				this.model.set("root_node", true)
				var conversation_script = new ConversationScriptView(_.extend(this.incoming_options, {el: this.ui.intro_script_region, model: this.model, collection: this.model.get("dialog_options")}));
				conversation_script.render();

				if(!this.centered_once) {
					setTimeout(function() { view.centered_once = true; view.$el.get(0).scrollLeft = (view.$el.get(0).scrollWidth - view.$el.get(0).clientWidth) / 2 }, 200);
				}
                        }

			/*setTimeout(function() {
				view.$el.find('.conversation_pan_region').panzoom({
					contain: 'invert'
				});

			}, 300);*/
		},

		onClickNew: function() {
			var view = this;

			// Add them to collection for saving
			//
			this.model = new DialogScript({text: "Hello", game_id: this.game.id,
				dialog_id: this.dialog.id});

			var dialog_option = new DialogOption({prompt: "Bye bye", game_id: this.game.id, dialog_id: this.dialog.id});
			this.model.set("dialog_options", new DialogOptionsCollection([dialog_option]));

			var character = new Character({name: "You"})
			var media = new Media({media_id: "0"});

			character.set("media", media);
			this.model.set("character", character);


			// FIXME make them temporary until 'saved'
			$.when(this.model.save()).done(function () {
					view.dialog.set("intro_dialog_script_id", view.model.id);
					dialog_option.set("parent_dialog_script_id", view.model.id);

					view.incoming_options.scripts.add(view.model);
					view.incoming_options.script_options.add(dialog_option);

					$.when(view.dialog.save(), dialog_option.save()).done(view.render);
			});
		}
	});
});
