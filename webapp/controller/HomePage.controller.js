sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"WF_RLS/controller/ErrorHandler",
	"sap/ui/model/resource/ResourceModel"
], function(Controller, ErrorHandler, ResourceModel) {
	"use strict";

	var busyDialog = new sap.m.BusyDialog();

	return Controller.extend("WF_RLS.controller.HomePage", {

		onInit: function() {

			// ********************* IMAGE MODEL ************************
			var vPathImage = jQuery.sap.getModulePath("WF_RLS") + "/Image/";
			var oImageModel = new sap.ui.model.json.JSONModel({
				path: vPathImage
			});
			this.getView().setModel(oImageModel, "JM_ImageModel");

			// **********************************************************

			this.f4Cache = {};

			var oUsernameSet = this.getOwnerComponent().getModel("JMConfig");
			oUsernameSet.read("/UsernameSet", {
				success: function(odata) {
					var oJsonModel = new sap.ui.model.json.JSONModel();
					oJsonModel.setData({
						Uname: odata.results[0].Uname,
						Sysid: odata.results[0].Agent,
						id: odata.results[0].Sysid
					});
					this.getView().setModel(oJsonModel, "JM_UserModel");
				}.bind(this),
				error: function(oResponse) {
					busyDialog.close();
					var sMessage = ErrorHandler.parseODataError(oResponse);
					ErrorHandler.showCustomSnackbar(sMessage, "Error");
				}
			});
			this.byId("id_Workflow").attachBrowserEvent("click", this.fnNavtoWorkflow, this);
			this.byId("id_RulesEngine").attachBrowserEvent("click", this.fnNavtoRules, this);

		},
		fnNavtoRules: function() {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("RulesEngine");
		},
		fnNavtoWorkflow: function() {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("Workflow");
		}

	});

});