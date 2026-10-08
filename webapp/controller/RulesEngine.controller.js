sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"WF_RLS/controller/ErrorHandler",
	"sap/ui/model/resource/ResourceModel",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Filter",
	"WF_RLS/Formatter/formatter"
], function(Controller, ErrorHandler, ResourceModel, FilterOperator, Filter, formatter) {
	"use strict";
	var i18n;
	var busyDialog = new sap.m.BusyDialog();
	return Controller.extend("WF_RLS.controller.RulesEngine", {
		formatter: formatter,
		onInit: function() {
			var i18nModel = new ResourceModel({
				bundleName: "WF_RLS.i18n.i18n"
			});
			this.getView().setModel(i18nModel, "i18n");

			i18n = this.getView().getModel("i18n").getResourceBundle();

			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute("RulesEngine").attachPatternMatched(this.fnRouter, this);
		},
		fnRouter: function() {

			var vPathImage = jQuery.sap.getModulePath("WF_RLS") + "/Image/";
			var oImageModel = new sap.ui.model.json.JSONModel({
				path: vPathImage
			});
			this.getView().setModel(oImageModel, "JM_ImageModel");

			// this.getView().byId("id_uwl_h").removeStyleClass("cl_listhighlight");
			// this.getView().byId("id_appList_h").removeStyleClass("cl_listhighlight");
			// this.getView().byId("id_dashBoard_h").removeStyleClass("cl_listhighlight");
			// this.getView().byId("id_RulesEngine_h").removeStyleClass("cl_list_con");
			// this.getView().byId("id_workFlow_h").removeStyleClass("cl_listhighlight");
			// this.getView().byId("id_workFlow_h").addStyleClass("cl_list_con");
			// this.getView().byId("id_appList_h").addStyleClass("cl_list_con");
			// this.getView().byId("id_uwl_h").addStyleClass("cl_list_con");
			// this.getView().byId("id_dashBoard_h").addStyleClass("cl_list_con");
			// this.getView().byId("id_RulesEngine_h").addStyleClass("cl_listhighlight");

			var that = this;
			var vmodel = this.getOwnerComponent().getModel("JMConfig");
			vmodel.read("/RulesSet", {
				filters: [new sap.ui.model.Filter("RulesCheck", sap.ui.model.FilterOperator.EQ, "X")],
				success: function(oData) {
					var oJsonModel = new sap.ui.model.json.JSONModel();
					oJsonModel.setData({
						results: oData.results
					});

					// Set model globally
					sap.ui.getCore().setModel(oJsonModel, "JM_FILTEREDRULE");

					var vFilterModel = sap.ui.getCore().getModel("JM_FILTEREDRULE");
					if (vFilterModel) {
						var aResults = vFilterModel.getProperty("/results");
						var aFmmDesList = aResults
							.filter(function(item) {
								return item.Fgroup === "035";
							})
							.map(function(item) {
								return item.FmmDes;
							});
						var oFmmDesModel = new sap.ui.model.json.JSONModel({
							FmmDesList: aFmmDesList
						});
						sap.ui.getCore().setModel(oFmmDesModel, "JM_FIELDDESC");
					}

				},
				error: function() {
					ErrorHandler.showCustomSnackbar(i18n.getText("FailedLoadFilteredRules"), "Error", that);

				}.bind(this)
			});
			/*Load User Details*/
			var vUserModel = this.getOwnerComponent().getModel("JMConfig");
			vUserModel.read("/UsernameSet", {
				success: function(odata) {
					var oJsonModel = new sap.ui.model.json.JSONModel();
					oJsonModel.setData({
						Uname: odata.results[0].Uname,
						Sysid: odata.results[0].Agent,
						id: odata.results[0].Sysid
					});
					that.getView().setModel(oJsonModel, "JM_User");
				}
			});
			/*Button Enable model*/
			var oEnableModel = new sap.ui.model.json.JSONModel({
				Create: false,
				Add: false,
				Remove: false,
				Copy: false,
				Save: false,
				Delete: false,
				Refresh: false,
				Mass: false
			});
			this.getView().setModel(oEnableModel, "JM_Enabled");
		},
		// *--------------------------------------------------------------------------------------
		//								Rules Engine F4 Functinalities
		// *--------------------------------------------------------------------------------------
		fnAppId: function(oEvent) {
			this.selectedField = "RID_MASTER";
			var oPayload = {
				F4Type: "F",
				FieldId: "RID_MASTER",
				Process: "R"
			};
			oPayload.NavSerchResult = [];
			this.bindTextF4model(oPayload, oEvent);
		},

		fnGetScreens: function(oEvent) {
			var vappid = this.getView().byId("RID_MASTER").getValue().split("-")[0].trim();
			if (!vappid) {
				ErrorHandler.showCustomSnackbar(
					i18n.getText("PleaseSelectAppId"),
					"Information",
					this
				);
				return;
			}
			this.selectedField = "id_Screen";
			var vModel = this.getOwnerComponent().getModel("JMConfig");
			busyDialog.open();
			vModel.read("/RulesSet", {
				filters: [new Filter("App", FilterOperator.EQ, vappid)],
				success: function(oData) {
					var jsonList = {
						List: oData.results
					};
					var oJsonList = new sap.ui.model.json.JSONModel();
					oJsonList.setData(jsonList);
					this.getView().setModel(oJsonList, "JM_Screens");
					var oJsonModel;
					var vTitle;
					var oLabels = {};
					var vLength;
					var aFormattedRows = [];

					if (oData.MsgType === "E") {
						ErrorHandler.showCustomSnackbar(oData.Message, "Error", this);
						return;
					}
					var aResults = oData.results;
					if (aResults.length > 0) {
						vLength = aResults.length;
						oLabels.col1 = "Screen ID";
						oLabels.col2 = "Screen Name";
						aResults.forEach(function(item) {
							var row = {};
							row.col1 = item.Fgroup;
							row.col2 = item.Vwnm;
							aFormattedRows.push(row);
						});
						oJsonModel = new sap.ui.model.json.JSONModel({
							labels: oLabels,
							rows: aFormattedRows
						});
						this.getView().setModel(oJsonModel, "JM_F4Model");
						this.getView().getModel("JM_F4Model");
						vTitle = this.getView().getModel("JM_F4Model").getData().labels.col1 + " (" + vLength + ")";
						this.fnF4fragopen(oEvent, vTitle).open();

					} else {
						ErrorHandler.showCustomSnackbar(
							i18n.getText("ScreenNotMaintainedForAppId"),
							"Info",
							this
						);
						busyDialog.close();
					}
					busyDialog.close();
				}.bind(this),
				error: function(oResponse) {
					busyDialog.close();
					var sMessage = ErrorHandler.parseODataError(oResponse);
					ErrorHandler.showCustomSnackbar(sMessage, "Error", this);
				}.bind(this)
			});
		},

		fnGetRuleSet: function(oEvent) {
			var that = this;
			var vmodel = that.getOwnerComponent().getModel("JMConfig");
			var vscreen = this.getView().byId("id_Screen").getValue().split("-")[0].trim();
			busyDialog.open();
			this.rulesetF4flag = true;
			vmodel.read("/RulesSet", {
				filters: [new Filter("Fgroup", FilterOperator.EQ, vscreen)],
				success: function(oData) {
					var oJsonModel;
					var vTitle;
					var oLabels = {};
					var vLength;
					var aFormattedRows = [];
					var filteredResults = [];
					var oDataResults = oData.results;
					for (var i = 0; i < oDataResults.length; i++) {
						var data = oDataResults[i];
						if (data.VwnmId === "ID_KEY" && data.FnmId.substring(0, 3) === "KID") {
							filteredResults.push(data);
						} else if (data.VwnmId !== "ID_KEY" && data.FnmId.substring(0, 3) !== "KID") {
							filteredResults.push(data);
						}
					}
					var aResults = filteredResults;
					if (aResults.length > 0) {
						vLength = aResults.length;
						oLabels.col1 = "Rule Set Desc";
						aResults.forEach(function(item) {
							var row = {};
							row.col1 = item.FmmDes;
							aFormattedRows.push(row);
						});
						oJsonModel = new sap.ui.model.json.JSONModel({
							labels: oLabels,
							rows: aFormattedRows
						});
						this.getView().setModel(oJsonModel, "JM_F4Model");
						this.getView().getModel("JM_F4Model");
						vTitle = this.getView().getModel("JM_F4Model").getData().labels.col1 + " (" + vLength + ")";
						var jsonList = {
							List: filteredResults
						};
						var oJsonList = new sap.ui.model.json.JSONModel();
						oJsonList.setData(jsonList);
						this.getView().setModel(oJsonList, "JM_RuleSet");
						this.fnF4fragopen(oEvent, vTitle).open();
						busyDialog.close();
					} else {
						ErrorHandler.showCustomSnackbar(
							i18n.getText("RuleSetIdNotMaintained"),
							"Info",
							this
						);

						busyDialog.close();
					}
				}.bind(this),
				error: function(oResponse) {
					busyDialog.close();
					var sMessage = ErrorHandler.parseODataError(oResponse);
					ErrorHandler.showCustomSnackbar(sMessage, "Error", this);
				}.bind(this)
			});
		},

		fnvalue: function(oEvent) {
			var vContext = oEvent.getSource().getBindingContext("JM_RuleData");
			if (vContext) {
				this.vSelectedRowPath = vContext.getPath();
				var fnmIdValue = vContext.getProperty("FnmId");
				var resultmodel = sap.ui.getCore().getModel("JM_FILTEREDRULE");
				var aresults = resultmodel.getProperty("/results");
				var oTargetField = aresults.find(function(item) {
					return item.FnmId === fnmIdValue;
				});
				if (oTargetField) {
					var vid = oTargetField.FnmId;
					var vSearchhelp = oTargetField.SearchHelp;
					var vProcess = oTargetField.Process;
					if (vSearchhelp === "T") {
						this.fnDatePicker(oEvent.getSource());
					} else if (vSearchhelp === "F") {
						var oPayload = {
							F4Type: vSearchhelp,
							FieldId: vid,
							Process: "X"
						};
						oPayload.NavSerchResult = [];
						this.ruleDataValueFlag = true;
						this.bindTextF4model(oPayload, oEvent);
						// this.fnSearchHelp(oEvent.getSource(), oPayload);
					} else {
						oPayload = {
							F4Type: vSearchhelp,
							FieldId: vid,
							Process: vProcess
						};
						oPayload.NavSerchResult = [];
						this.ruleDataValueFlag = true;
						this.bindTextF4model(oPayload, oEvent);
						// this.fnSearchHelp(oEvent.getSource(), oPayload);
					}
				}
			} else {
				vContext = oEvent.getSource().getBindingContext("JM_MassRuleData");
				if (vContext) {
					this.vSelectedRowPath = vContext.getPath();
					var fnmIdValue = vContext.getProperty("FnmId");
					var resultmodel = sap.ui.getCore().getModel("JM_FILTEREDRULE");
					var aresults = resultmodel.getProperty("/results");
					var oTargetField = aresults.find(function(item) {
						return item.FnmId === fnmIdValue;
					});
					if (oTargetField) {
						var vid = oTargetField.FnmId;
						var vSearchhelp = oTargetField.SearchHelp;
						var vProcess = oTargetField.Process;
						if (vSearchhelp === "T") {
							this.fnDatePicker(oEvent.getSource());
						} else if (vSearchhelp === "F") {
							var oPayload = {
								F4Type: vSearchhelp,
								FieldId: vid,
								Process: "X"
							};
							oPayload.NavSerchResult = [];
							this.MassruleDataValueFlag = true;
							this.bindTextF4model(oPayload, oEvent);

						} else {
							oPayload = {
								F4Type: vSearchhelp,
								FieldId: vid,
								Process: vProcess
							};
							oPayload.NavSerchResult = [];
							this.MassruleDataValueFlag = true;
							this.bindTextF4model(oPayload, oEvent);

						}
					}
				}
			}

		},
		bindSearchepModel: function(state, oData) {
			if (state) {
				var label1 = oData.NavSerchResult.results.length > 0 ? oData.NavSerchResult.results[0].Label1 : "";
				var jsonList = {
					Label1: label1,
					List: oData.NavSerchResult.results
				};
				var oJsonList = new sap.ui.model.json.JSONModel();
				oJsonList.setData(jsonList);
				this.getView().setModel(oJsonList, "JM_SearchHelp");
			}
		},

		fnfieldname: function(oEvent) {
			var oJsonModel;
			var vTitle;
			var oLabels = {};
			var vLength;
			var aFormattedRows = [];
			var vappid = this.getView().byId("RID_MASTER").getValue().split("-")[0].trim();
			this.index1 = oEvent.getSource().getBindingContext("JM_RuleData").getPath().split('/');
			var vModel = this.getOwnerComponent().getModel("JMConfig");
			var fnmSet = new Set();
			var tModel = this.getView().getModel("JM_RuleData");
			if (tModel) {
				var tData = tModel.getProperty("/") || [];
				tData.forEach(function(parent) {
					if (parent.Fnm) {
						fnmSet.add(parent.Fnm);
					}
					if (Array.isArray(parent.Input)) {
						parent.Input.forEach(function(child) {
							if (child.Fnm) {
								fnmSet.add(child.Fnm);
							}
						});
					}
				});
			}
			var vscreen = this.getView().byId("id_Screen").getValue().split("-")[0].trim();
			busyDialog.open();
			vModel.read("/RulesSet", {
				// filters: [
				// 	new Filter("Fgroup", FilterOperator.EQ, vscreen)
				// ],
				filters: [
					new sap.ui.model.Filter("App", sap.ui.model.FilterOperator.EQ, vappid),
					new sap.ui.model.Filter("Flag", sap.ui.model.FilterOperator.EQ, "X")
				],
				success: function(oData, Response) {
					var filteredFields = oData.results.filter(function(item) {
						return !fnmSet.has(item.Fnm); // Exclude if already in JM_TTABLE
					});
					var jsonList = {
						List: filteredFields
					};
					var oJsonList = new sap.ui.model.json.JSONModel();
					oJsonList.setData(jsonList);
					this.getView().setModel(oJsonList, "JM_Fields");
					vLength = filteredFields.length;
					oLabels.col1 = "Field Name";
					oLabels.col2 = "Field Descriptions";
					oLabels.col3 = "Field ID";
					filteredFields.forEach(function(item) {
						var row = {};
						row.col1 = item.Fnm;
						row.col2 = item.FmmDes;
						row.col3 = item.FnmId;
						// row.col4 = item.Value4;
						aFormattedRows.push(row);
					});
					oJsonModel = new sap.ui.model.json.JSONModel({
						labels: oLabels,
						rows: aFormattedRows
					});
					this.getView().setModel(oJsonModel, "JM_F4Model");
					this.getView().getModel("JM_F4Model");
					this.ruleDataFieldNameFlag = true;
					vTitle = this.getView().getModel("JM_F4Model").getData().labels.col1 + " (" + vLength + ")";
					this.fnF4fragopen(oEvent, vTitle).open();
					// oLabels.col4 = oFirst.Label4;
					busyDialog.close();
					// 		that.rulefieldfrag.open();
				}.bind(this),
				error: function(oResponse) {
					busyDialog.close();
				}
			});
		},

		bindTextF4model: function(opayload, oEvent) {
			var oJsonModel;
			var vTitle;
			var oLabels = {};
			var vLength;
			var aFormattedRows = [];
			var omodel1 = this.getOwnerComponent().getModel("JMConfig");
			busyDialog.open();
			omodel1.create("/SearchHelpSet", opayload, {
				success: function(odata) {
					busyDialog.close();
					if (odata.MsgType === "E") {
						ErrorHandler.showCustomSnackbar(odata.Message, "Error", this);
						return;
					}
					var aResults = odata.NavSerchResult.results;
					if (aResults.length > 0) {
						var oFirst = aResults[0];
						if (oFirst && (oFirst.DomvalueL || oFirst.Ddtext)) {
							if (oFirst.MsgType === "I" || oFirst.MsgType === "E") {
								ErrorHandler.showCustomSnackbar(oFirst.Message, "Error");
								return;
							}
							vLength = aResults.length;
							oLabels.col1 = "Key";
							if (oFirst.Label2) oLabels.col2 = oFirst.Label2;
							aResults.forEach(function(item) {
								var row = {};
								if (oLabels.col1) row.col1 = item.DomvalueL;
								if (oLabels.col2) row.col2 = item.Ddtext;
								if (oLabels.col3) row.col3 = item.DomvalueL3;
								if (oLabels.col4) row.col4 = item.DomvalueL4;
								aFormattedRows.push(row);
							});
							oJsonModel = new sap.ui.model.json.JSONModel({
								labels: oLabels,
								rows: aFormattedRows
							});
							var jsonList = {
								List: odata.NavSerchResult.results
							};
							var oJsonList = new sap.ui.model.json.JSONModel();
							oJsonList.setData(jsonList);
							this.getView().setModel(oJsonList, "JM_Appid");
							this.getView().setModel(oJsonModel, "JM_F4Model");
							this.bindSearchepModel(this.ruleDataValueFlag, odata);
							var textValue = this.getView().byId(this.selectedField + "_TXT");
							if (textValue) {
								vTitle = textValue.getText() + " (" + vLength + ")";
							} else {
								vTitle = "Application Master";
							}
							this.fnF4fragopen(oEvent, vTitle).open();
						} else {
							vLength = odata.NavSerchResult.results.length;
							if (oFirst.MsgType === "I" || oFirst.MsgType === "E") {
								ErrorHandler.showCustomSnackbar(oFirst.Message, "Error", this);
								return;
							}
							if (oFirst.Label1) oLabels.col1 = oFirst.Label1;
							if (oFirst.Label2) oLabels.col2 = oFirst.Label2;
							if (oFirst.Label3) oLabels.col3 = oFirst.Label3;
							if (oFirst.Label4) oLabels.col4 = oFirst.Label4;

							if (this.selectedField === "ID_RECI_VAGRP") {
								aResults
									.filter(function(item) {
										return item.Value3 === this.getView().getModel("JM_KeydataModel").getProperty("/Werks");
									})
									.forEach(function(item) {
										var row = {};
										row.col1 = item.Value1;
										if (oLabels.col2) row.col2 = item.Value2;
										if (oLabels.col3) row.col3 = item.Value3;
										if (oLabels.col4) row.col4 = item.Value4;
										aFormattedRows.push(row);
									});
							} else {
								aResults.forEach(function(item) {
									var row = {};
									if (oLabels.col1 === "Material") {
										row.col1 = item.Value1 ? item.Value1.replace(/^0+/, "") : item.Value1;
									} else {
										row.col1 = item.Value1;
									}
									if (oLabels.col2) row.col2 = item.Value2;
									if (oLabels.col3) row.col3 = item.Value3;
									if (oLabels.col4) row.col4 = item.Value4;
									aFormattedRows.push(row);
								});
							}
							oJsonModel = new sap.ui.model.json.JSONModel({
								labels: oLabels,
								rows: aFormattedRows
							});
							this.getView().setModel(oJsonModel, "JM_F4Model");
							this.getView().getModel("JM_F4Model");
							this.bindSearchepModel(this.ruleDataValueFlag, odata);
							if (this.agentFieldFlag) {
								var jsonList = {
									List: aResults
								};
								var oJsonList = new sap.ui.model.json.JSONModel();
								oJsonList.setData(jsonList);
								this.getView().setModel(oJsonList, "JM_Agents");
								// this.agentFieldFlag = false;
							}
							vTitle = this.getView().getModel("JM_F4Model").getData().labels.col1 + " (" + vLength + ")";
							this.fnF4fragopen(oEvent, vTitle).open();
						}
					}

				}.bind(this),
				error: function(oResponse) {
					busyDialog.close();
					var sMessage = ErrorHandler.parseODataError(oResponse);
					ErrorHandler.showCustomSnackbar(sMessage, "Error", this);
				}
			});

		},

		fnF4fragopen: function(oEvent, vTitle) {
			if (!this.f4HelpFrag) {
				this.f4HelpFrag = sap.ui.xmlfragment(this.getView().getId(), "WF_RLS.fragment.F4Help", this);
				this.getView().addDependent(this.f4HelpFrag);
			}
			this.f4HelpFrag.setTitle(vTitle);
			return this.f4HelpFrag;
		},

		fnf4HelpCancel: function(oEvent) {
			this.fnF4fragopen().close();
			this.f4HelpFrag.destroy();
			this.f4HelpFrag = null;
		},

		fnAfterCloseFragment: function(oEvent) {
			this.fnF4fragopen().close();
			this.f4HelpFrag.destroy();
			this.f4HelpFrag = null;
		},

		fnValueSearch: function(oEvent) {
			var oInput = oEvent.getSource();
			var sValue = oInput.getValue();
			oInput.setValue(sValue.toUpperCase());
			var sQuery = oEvent.getSource().getValue().toLowerCase();
			// Get table and binding
			var oTable = this.byId("idMaterialTable");
			var oBinding = oTable.getBinding("items");
			if (!oBinding) return;
			var aFilters = [];
			// Filter on all possible columns
			if (sQuery) {
				aFilters.push(new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("col1", sap.ui.model.FilterOperator.StartsWith, sQuery),
						new sap.ui.model.Filter("col2", sap.ui.model.FilterOperator.StartsWith, sQuery),
						new sap.ui.model.Filter("col3", sap.ui.model.FilterOperator.StartsWith, sQuery),
						new sap.ui.model.Filter("col4", sap.ui.model.FilterOperator.StartsWith, sQuery)
					],
					and: false
				}));
			}
			oBinding.filter(aFilters, "Application");
		},

		fnAppIdSearch: function(oEvent) {
			var vValue = oEvent.getParameter("value");
			var vFilter = [
				new Filter("DomvalueL", FilterOperator.Contains, vValue),
				new Filter("Ddtext", FilterOperator.Contains, vValue)
			];

			var vBinding = oEvent.getSource().getBinding("items");
			var vFinalFilter = new Filter(vFilter, false);
			vBinding.filter(vFinalFilter);
		},

		fnF4Itempress: function(oEvent) {
			var oItem = oEvent.getSource();
			var oContext = oItem.getBindingContext("JM_F4Model");
			if (!oContext) {
				return;
			}

			if (this.getView().byId(this.selectedField)) {
				this.getView().byId(this.selectedField).setValueState("None");
			}
			var item = oContext.getProperty("col1"); // Value (e.g., 'IN')
			var item1 = oContext.getProperty("col2"); // Description (e.g., 'India')
			var item2 = oContext.getProperty("col3"); // Description (e.g., 'India')
			if (this.selectedField === "RID_MASTER") {
				this.getView().byId("RID_MASTER").setValue(item + " - " + item1);
				this.getView().byId("id_Screen").setValue("");
			} else if (this.selectedField === "id_Screen") {
				this.getView().byId("id_Screen").setValue(item + " - " + item1);
				this.vRulesFetched = false;
			} else if (this.rulesetF4flag) {
				this.fnRuleSetClose(item);
				this.rulesetF4flag = false;
			} else if (this.MassruleDataValueFlag) {
				this.fnMassSearchHelpConfirm(item, item1);
				this.MassruleDataValueFlag = false;
			} else if (this.ruleDataValueFlag) {
				this.fnSearchHelpConfirm(item, item1);
				this.ruleDataValueFlag = false;
			} else if (this.ruleDataFieldNameFlag) {
				this.fnRuleFieldConfirm(item, item1, item2);
				this.ruleDataFieldNameFlag = false;
			}
			this.fnAfterCloseFragment();
			this.selectedField = null;
		},

		fnSearchHelpConfirm: function(item, item1) {
			var oModel = this.getView().getModel("JM_RuleData");
			oModel.setProperty(this.vSelectedRowPath + "/Value", item);
			oModel.setProperty(this.vSelectedRowPath + "/RuleText", item1);
		},
		fnMassSearchHelpConfirm: function(item, item1) {
			var oModel = this.getView().getModel("JM_MassRuleData");
			oModel.setProperty(this.vSelectedRowPath + "/Value", item);
			oModel.setProperty(this.vSelectedRowPath + "/RuleText", item1);
			oModel.setProperty(this.vSelectedRowPath + "/Value_VS", "None");

			var aData = oModel.getProperty("/");
			var availableCount = 0;

			aData.forEach(function(parent) {

				var hasParentValue = !!parent.Value;

				var hasAnyChildValue =
					Array.isArray(parent.Input) &&
					parent.Input.some(function(child) {
						return !!child.Value;
					});

				if (hasParentValue || hasAnyChildValue) {
					availableCount++;
				}
			});

			sap.ui.core.Fragment.byId("ID_MASSRULES", "id_availableRec").setText("(" + availableCount + ")");
		},
		fnRuleSetClose: function(item) {
			var vRulesetTable = this.getView().byId("id_ruleTable");
			var vItemIndex = vRulesetTable.getSelectedIndex();

			var arr = this.getView().getModel("JM_RuleSet").getData();
			var Arrres = [];
			for (var i = 0; i < arr.List.length; i++) {
				var currentItem = arr.List[i];
				if (currentItem && currentItem.FmmDes === item) {
					var oarr = {
						AppId: currentItem.App,
						Fgroup: currentItem.Fgroup,
						Fnm: currentItem.Fnm,
						FnmId: currentItem.FnmId,
						Vwnm: currentItem.Vwnm,
						VwnmId: currentItem.VwnmId
					};
					Arrres.push(oarr);
				}
			}
			var aRulesId = this.getView().getModel("JM_RuleRef").getData();
			var vRuleSetId = "";
			if (!aRulesId || aRulesId.length === 0) {
				vRuleSetId = "001"; // default initial value if no prior RuleSetId found
			} else {
				vRuleSetId = parseInt(aRulesId[aRulesId.length - 1].RuleSetId) + 1;
				vRuleSetId = vRuleSetId + '';
				vRuleSetId = vRuleSetId.padStart(3, "0");
			}
			if (item) {
				// var vSave = 2;
				var oTabModel = this.getView().getModel("JM_Rules");
				if (oTabModel) {
					var oTabData = oTabModel.getData();
					// Check if Rule array and index exists
					if (oTabData.Rule && oTabData.Rule[vItemIndex]) {
						oTabData.Rule[vItemIndex].FmmDes = item;
						oTabData.Rule[vItemIndex].AppId = Arrres[0].AppId;
						oTabData.Rule[vItemIndex].Fgroup = Arrres[0].Fgroup;
						oTabData.Rule[vItemIndex].Fnm = Arrres[0].Fnm;
						oTabData.Rule[vItemIndex].FnmId = Arrres[0].FnmId;
						oTabData.Rule[vItemIndex].RuleSetId = vRuleSetId;
						oTabData.Rule[vItemIndex].Vwnm = Arrres[0].Vwnm;
						oTabData.Rule[vItemIndex].VwnmId = Arrres[0].VwnmId;
						oTabModel.refresh(true);
					}
				}
			}
		},
		fnAppIdClose: function(oEvent) {
			var vitem = oEvent.getParameter("selectedItem").getProperty("title");
			this.getView().byId("RID_MASTER").setValue(vitem);
			this.getView().byId("id_Screen").setValue("");

		},
		fnRuleFieldConfirm: function(item, item1, item2) {
			var vFnm = item;
			var vFnmDes = item1;
			var vFnmId = item2;
			var oTabModel = this.getView().getModel("JM_RuleData");
			var oTabData = oTabModel.getData();
			var rowRef;
			if (this.index1.length === 4) {
				rowRef = oTabData[this.index1[1]].Input[this.index1[3]];
			} else if (this.index1.length === 2) {
				rowRef = oTabData[this.index1[1]];
			}
			if (!rowRef) {
				return;
			}
			if (rowRef.Fnm !== vFnm) {
				rowRef.Value = "";
				rowRef.RuleText = "";
			}
			rowRef.Fnm = vFnm;
			rowRef.FmmDes = vFnmDes;
			rowRef.FnmId = vFnmId;
			oTabModel.refresh(true);
		},

		// *-----------------------------------------------------------------------------------------
		//					Search Button functionality press
		// *-----------------------------------------------------------------------------------------
		fnGetRules: function() {
			var that = this;
			var vappid = this.getView().byId("RID_MASTER").getValue().split("-")[0].trim();
			var vscreen = this.getView().byId("id_Screen").getValue().split("-")[0].trim();
			var vtable = this.getView().byId("id_ruleTable");
			if (!vappid) {
				this.getView().byId("RID_MASTER").setValueState("Error");
				this.getView().byId("RID_MASTER").setValueStateText(i18n.getText("PleaseSelectAppId"));
				ErrorHandler.showCustomSnackbar(i18n.getText("PleaseSelectAppIdError"), "Error", this);
				return;
			}
			if (!vscreen) {
				this.getView().byId("id_Screen").setValueState("Error");
				this.getView().byId("id_Screen").setValueStateText(i18n.getText("PleaseSelectScreen"));
				ErrorHandler.showCustomSnackbar(i18n.getText("PleaseSelectScreen"), "Error", this);

				return;
			}
			this.getView().byId("id_createruleset").setEnabled(true);
			this.getView().byId("id_saveruleset").setEnabled(true);
			this.getView().byId("id_deleteruleset").setEnabled(true);
			var vModel = this.getOwnerComponent().getModel("JMConfig");
			busyDialog.open();
			vModel.read("/RulehSet", {
				filters: [
					new Filter("AppId", FilterOperator.EQ, vappid),
					new Filter("Fgroup", FilterOperator.EQ, vscreen)
				],
				success: function(oData) {
					var jsonList = {
						Rule: oData.results
					};
					var oJsonList = new sap.ui.model.json.JSONModel();
					oJsonList.setData(jsonList);
					that.getView().setModel(oJsonList, "JM_Rules");
					busyDialog.close();
					that.vRulesFetched = true;
					// that.fnref();
					if (oData.results && oData.results.length > 0) {
						vtable.setSelectedIndex(0);
						that.fnRuleSetSelection();
					} else {
						that.getView().getModel("JM_RuleData").setData({});
					}
				},
				error: function(oResponse) {
					busyDialog.close();
					var sMessage = ErrorHandler.parseODataError(oResponse);
					ErrorHandler.showCustomSnackbar(sMessage, "Error", this);
				}.bind(this)
			});
		},

		// *-----------------------------------------------------------------------------------------
		//					Rule Set Row Selection
		// *-----------------------------------------------------------------------------------------
		fnRuleSetSelection: function(oEvent) {
			if (this.hasUnsavedChanges) {
				this.pendingEvent = oEvent;
				var vConfirmModel = new sap.ui.model.json.JSONModel({
					headerText: "Confirmation",
					confirmationText: "Are you sure unsaved data will be lost?",
					positiveText: "Yes",
					negativeText: "No",
					positiveIcon: this.fnImageload("Apply"),
					negativeIcon: this.fnImageload("Cancel"),
					action: "UnsavedData"
				});
				this.getView().setModel(vConfirmModel, "JM_Confirm");
				if (!this.confirmfrag) {
					this.confirmfrag = sap.ui.xmlfragment("WF_RLS.Fragment.Confirmation", this);
					this.getView().addDependent(this.confirmfrag);
				}
				this.confirmfrag.open();
				return;
			}
			this.fnProcessSelection(oEvent);
		},

		fnProcessSelection: function(oEvent) {
			var vtable = this.getView().byId("id_ruleTable");
			var vTreeTable = this.getView().byId("id_datatable");
			var vSelectedIndex = vtable.getSelectedIndex();
			if (vSelectedIndex === -1) {
				this.getView().byId("id_datatable").clearSelection();
				this.getView().getModel("JM_RuleItems").refresh(true);
				return;
			}
			var vTableContext = vtable.getContextByIndex(vSelectedIndex);
			var vdata = vtable.getModel("JM_Rules").getProperty(vTableContext.getPath());
			var vRuleSetId = vdata.RuleSetId;
			var that = this;
			var vModel = this.getOwnerComponent().getModel("JMConfig");
			busyDialog.open();
			vModel.read("/RuleISet", {
				filters: [new Filter("RuleSetId", FilterOperator.EQ, vRuleSetId)],
				success: function(oData) {
					var jsonList = {
						RuleSet: oData.results
					};
					var oJsonList = new sap.ui.model.json.JSONModel();
					oJsonList.setData(jsonList);
					that.getView().setModel(oJsonList, "JM_RuleItems");
					busyDialog.close();
					that.fnsetTable();
					vTreeTable.setSelectedIndex(0);
					// vTreeTable.attachRowsUpdated(function() {
					// 	vTreeTable.setSelectedIndex(0);
					// });
					var allItems = oJsonList.getData().RuleSet || [];

					var relatedItems = allItems.filter(function(item) {
						return item.RuleSetId === vRuleSetId;
					});
					var allRuleIds = new Set(
						oData.results.map(function(item) {
							return item.RuleId;
						})
					);
					var ruleidcount = allRuleIds.size;
					var vEnableModel = that.getView().getModel("JM_Enabled");
					if (relatedItems.length === 0 && ruleidcount === 0) {
						vEnableModel.setProperty("/Create", true); // create
						vEnableModel.setProperty("/Add", false); // add & Remove
						vEnableModel.setProperty("/Remove", false);
						vEnableModel.setProperty("/Copy", false); // copy
						vEnableModel.setProperty("/Save", false); // Delete & Refresh & save
						vEnableModel.setProperty("/Delete", false);
						vEnableModel.setProperty("/Refresh", false);
						vEnableModel.setProperty("/Mass", false);
					} else if (ruleidcount === 1) {
						var InputData = that.getView().getModel("JM_RuleData").getData()[0];
						var bHasInput = InputData.Input.length > 0;

						vEnableModel.setProperty("/Create", true);
						vEnableModel.setProperty("/Add", true);
						vEnableModel.setProperty("/Remove", true);
						vEnableModel.setProperty("/Save", true);
						vEnableModel.setProperty("/Delete", false);
						vEnableModel.setProperty("/Refresh", false);

						vEnableModel.setProperty("/Copy", bHasInput);
						vEnableModel.setProperty("/Mass", bHasInput);
					} else {
						vEnableModel.setProperty("/Create", true);
						vEnableModel.setProperty("/Add", false);
						vEnableModel.setProperty("/Remove", false);
						vEnableModel.setProperty("/Copy", true);
						vEnableModel.setProperty("/Save", true);
						vEnableModel.setProperty("/Delete", true);
						vEnableModel.setProperty("/Refresh", true);
						vEnableModel.setProperty("/Mass", true);
					}

				},
				error: function(oResponse) {
					busyDialog.close();
				}
			});
			var vColumn = this.getView().byId("id_tableui");
			if (vColumn) {
				var isVisible = this.fnCheckTableUi();
				vColumn.setVisible(isVisible);
			}

		},

		fnUnsavedPopup: function() {
			this.hasUnsavedChanges = false;
			this.fnProcessSelection(this.pendingEvent);
			this.pendingEvent = null;
		},

		// *-----------------------------------------------------------------------------------------
		//					Rule Data Row Selection
		// *-----------------------------------------------------------------------------------------
		fnExpandNode: function(oEvent) {
			var oTable = this.getView().byId("id_datatable");
			var oCtx = oEvent.getParameter("rowContext");

			if (!oCtx) {
				return;
			}

			// Wait until TreeTable finishes expanding
			setTimeout(function() {

				// Clear old selections
				oTable.clearSelection();

				// Find expanded row index
				var iIndex = oTable.getRows().findIndex(function(oRow) {
					return oRow.getBindingContext() === oCtx;
				});

				if (iIndex > -1) {
					oTable.setSelectedIndex(iIndex);
				}

			}, 0);
		},

		/********************Set Rule Data in tree table***********************/
		fnsetTable: function() {
			var vRuleset = this.getView().getModel("JM_RuleItems").getData();
			var vRulesetInputs = [];
			var vRulesetOutputs = [];
			var vResults = [];
			var vRuleData = [];
			for (var i = 0; i < vRuleset.RuleSet.length; i++) {
				if (vRuleset.RuleSet[i].Ftype === 'R') {
					vRulesetOutputs.push(vRuleset.RuleSet[i]);
				} else if (vRuleset.RuleSet[i].Ftype === 'I') {
					vRulesetInputs.push(vRuleset.RuleSet[i]);
				}
			}
			for (var a = 0; a < vRulesetOutputs.length; a++) {
				var aInput = [];
				for (var b = 0; b < vRulesetInputs.length; b++) {
					var arr;
					if (vRulesetInputs[b].RuleId === vRulesetOutputs[a].RuleId) {
						arr = {
							'FmmDes': vRulesetInputs[b].FmmDes,
							'Fnm': vRulesetInputs[b].Fnm,
							'FnmId': vRulesetInputs[b].FnmId,
							'Ftype': vRulesetInputs[b].Ftype,
							'RuleId': vRulesetInputs[b].RuleId,
							'RuleSetId': vRulesetInputs[b].RuleSetId,
							'Value': vRulesetInputs[b].Value,
							'RuleText': vRulesetInputs[b].RuleText

						};

						aInput.push(arr);
					}
				}
				vResults = {

					'FmmDes': vRulesetOutputs[a].FmmDes,
					'Fnm': vRulesetOutputs[a].Fnm,
					'FnmId': vRulesetOutputs[a].FnmId,
					'Ftype': vRulesetOutputs[a].Ftype,
					'RuleId': vRulesetOutputs[a].RuleId,
					'RuleSetId': vRulesetOutputs[a].RuleSetId,
					'Value': vRulesetOutputs[a].Value,
					'RuleText': vRulesetOutputs[a].RuleText,
					'TableRow': vRulesetOutputs[a].TableRow,
					"ChangeInd": vRulesetOutputs[a].ChangeInd === "X",
					'Input': aInput

				};
				vRuleData.push(vResults);
			}
			var oModel = new sap.ui.model.json.JSONModel(vRuleData);
			this.getView().setModel(oModel, "JM_RuleData");
		},
		/********************Set Rule Data in tree table***********************/

		/********************Create RuleSet***********************/
		fnAddRuleSet: function() {
			if (this.vRulesFetched) {
				var that = this;
				var vtable = this.getView().byId("id_ruleTable");
				var vModel = vtable.getModel("JM_Rules");
				var vData = this.getView().getModel("JM_Rules").getData();
				if (vData.Rule.length !== 0) {
					if (vData.Rule[vData.Rule.length - 1].Fnm === "") {
						ErrorHandler.showCustomSnackbar(
							i18n.getText("PleaseSavePreviousRuleset"),
							"Information",
							this
						);

						return;
					}
				}
				var vNewEntry = {
					AppId: "",
					Fgroup: "",
					FmmDes: "",
					Fnm: "",
					FnmId: "",
					RuleSetId: "",
					Vwnm: "",
					VwnmId: "",
					isNew: true

				};
				var vItem = vModel.getProperty("/Rule");
				vItem.push(vNewEntry);
				vModel.setProperty("/Rule", vItem);
				var iNewIndex = vItem.length - 1;
				vtable.setSelectedIndex(iNewIndex);
				vtable.setFirstVisibleRow(iNewIndex);

				this.fnLoadRulesetIds();

			} else {
				ErrorHandler.showCustomSnackbar(
					i18n.getText("PleaseClickOnSearch"),
					"Information",
					this
				);

			}
		},
		/********************Create RuleSet***********************/

		/******************RuleSet SearchHelp*******************/

		fnRuleSetSearch: function(oEvent) {
			var vValue = oEvent.getParameter("value");
			var vFilter = [
				new Filter("FmmDes", FilterOperator.Contains, vValue)
			];
			var vBinding = oEvent.getSource().getBinding("items");
			var vFinalFilter = new Filter(vFilter, false);
			vBinding.filter(vFinalFilter);
		},

		/********************Delete RuleSet***********************/
		fnRemoveRuleSet: function() {

			var vRuleSetTable = this.getView().byId("id_ruleTable");
			var vItemIndex = vRuleSetTable.getSelectedIndex();
			if (vItemIndex === -1) {
				ErrorHandler.showCustomSnackbar(
					i18n.getText("PleaseSelectRulesetToDelete"),
					"Information",
					this
				);

				return;
			}

			var vConfirmModel = new sap.ui.model.json.JSONModel({
				headerText: "Confirmation",
				confirmationText: "Are you sure you want to Delete?",
				positiveText: "Yes",
				negativeText: "No",
				positiveIcon: this.fnImageload("Apply"),
				negativeIcon: this.fnImageload("Cancel"),
				action: "DeleteRuleSet"
			});
			this.getView().setModel(vConfirmModel, "JM_Confirm");
			if (!this.confirmfrag) {
				this.confirmfrag = sap.ui.xmlfragment("WF_RLS.Fragment.Confirmation", this);
				this.getView().addDependent(this.confirmfrag);

			}
			this.confirmfrag.open();
		},
		fnDeleteRuleSet: function() {
			var vRuleSetTable = this.getView().byId("id_ruleTable");
			var vItemIndex = vRuleSetTable.getSelectedIndex();
			var Arr = this.getView().getModel("JM_Rules").getData();
			var vSelectedRowData = [];
			vSelectedRowData.push(Arr.Rule[vItemIndex]);
			var vunsaved = vSelectedRowData[0].isNew;
			if (vunsaved) {
				Arr.Rule.splice(vItemIndex, 1); // remove from frontend array
				this.getView().getModel("JM_Rules").refresh(true);
				ErrorHandler.showCustomSnackbar(
					i18n.getText("UnsavedRulesetRemoved"),
					"Success",
					this
				);

				return;
			}

			var vNavruleh = {
				"Flag": 'D',
				"NavRuleh": vSelectedRowData
			};
			var that = this;
			var vModel = this.getOwnerComponent().getModel("JMConfig");
			busyDialog.open();
			vModel.create("/DeepRuleSet", vNavruleh, {
				success: function() {
					busyDialog.close();
					ErrorHandler.showCustomSnackbar(
						i18n.getText("RulesetDeletedSuccessfully"),
						"Success",
						that
					);

					var oEnabledModel = that.getView().getModel("JM_Enabled");
					oEnabledModel.setProperty("/Create", false);
					oEnabledModel.setProperty("/Add", false);
					oEnabledModel.setProperty("/Remove", false);
					oEnabledModel.setProperty("/Mass", false);
					setTimeout(function() {
						that.fnGetRules();
					}, 500); // wait half a second
				},
				error: function(oResponse) {
					busyDialog.close();
					var sMessage = ErrorHandler.parseODataError(oResponse);
					ErrorHandler.showCustomSnackbar(sMessage, "Error", this);
				}.bind(this)
			});

		},
		/********************Delete RuleSet***********************/

		/********************Save RuleSet***********************/
		fnSaveRuleSet: function() {
			var vArr = this.getView().getModel("JM_Rules").getData();

			if (vArr.Rule.length === 0) {
				ErrorHandler.showCustomSnackbar(
					i18n.getText("PleaseCreateRulesetValidData"),
					"Information",
					this
				);

				return;
			} else if (vArr.Rule.length !== 0) {
				if (vArr.Rule[vArr.Rule.length - 1].Fnm === '') {
					ErrorHandler.showCustomSnackbar(
						i18n.getText("PleaseEnterValidDataForAddedField"),
						"Information",
						this
					);

					return;
				}
			}
			var vConfirmModel = new sap.ui.model.json.JSONModel({
				headerText: "Confirmation",
				confirmationText: "Are you sure you want to save?",
				positiveText: "Yes",
				negativeText: "No",
				positiveIcon: this.fnImageload("Apply"),
				negativeIcon: this.fnImageload("Cancel"),
				action: "SaveRuleSet"
			});
			this.getView().setModel(vConfirmModel, "JM_Confirm");
			if (!this.confirmfrag) {
				this.confirmfrag = sap.ui.xmlfragment("WF_RLS.Fragment.Confirmation", this);
				this.getView().addDependent(this.confirmfrag);

			}
			this.confirmfrag.open();
		},
		fnRulesetSave: function() {
			var oTable = this.getView().byId("id_ruleTable");
			// var oRuleModel = this.getView().getModel("JM_Rules");
			var aSelectedItems = oTable.getSelectedIndex();

			var vTableContext = oTable.getContextByIndex(aSelectedItems);
			var vdata = oTable.getModel("JM_Rules").getProperty(vTableContext.getPath());

			if (aSelectedItems.length > 0) {
				ErrorHandler.showCustomSnackbar(
					i18n.getText("PleaseSelectAtLeastOneRule"),
					"Error",
					this
				);

				return;
			}
			delete vdata.isNew;

			var vNavh = {
				Flag: "H",
				NavRuleh: [vdata]
			};
			var that = this;
			var oODataModel = this.getOwnerComponent().getModel("JMConfig");
			busyDialog.open();

			oODataModel.create("/DeepRuleSet", vNavh, {
				success: function(oData) {
					busyDialog.close();
					if (oData.MsgType === "E") {
						ErrorHandler.showCustomSnackbar(oData.Message, "Error", that);
					} else {
						ErrorHandler.showCustomSnackbar(
							i18n.getText("RulesetSavedSuccessfully"),
							"Success",
							that
						);

						that.fnProcessSelection();
					}
				},
				error: function(oResponse) {
					busyDialog.close();
					var sMessage = ErrorHandler.parseODataError(oResponse);
					ErrorHandler.showCustomSnackbar(sMessage, "Error", that);
				}
			});
		},
		/********************Save RuleSet***********************/

		/********************RulesetModel Model for Rulesetid Generation***********************/
		fnLoadRulesetIds: function() {
			var that = this;
			var vmodel = this.getOwnerComponent().getModel("JMConfig");
			busyDialog.open();
			vmodel.read("/RulehSet", {

				filters: [new Filter("Fgroup", FilterOperator.EQ, '')],
				success: function(oData, Response) {

					var oJsonList = new sap.ui.model.json.JSONModel();
					oJsonList.setData(oData.results);
					that.getView().setModel(oJsonList, "JM_RuleRef");
					busyDialog.close();

				},
				error: function(oResponse) {
					busyDialog.close();
					var sMessage = ErrorHandler.parseODataError(oResponse);
					ErrorHandler.showCustomSnackbar(sMessage, "Error", this);
				}.bind(this)
			});
		},
		/********************RulesetModel Model for Rulesetid Generation***********************/

		/********************** Refrsh Functionality********************************/
		fnRefresh: function() {
			var vRuledataTable = this.getView().byId("id_datatable");
			var vRuleDataModel = this.getView().getModel("JM_RuleData");
			var vallData = vRuleDataModel.getProperty("/");
			var filteredData = vallData.filter(function(item) {
				return !item.isNew;
			});

			vRuleDataModel.setProperty("/", filteredData);
			this.hasUnsavedChanges = false;
			vRuledataTable.collapseAll();
			vRuledataTable.getBinding("rows").refresh();
			vRuledataTable.setSelectedIndex(0);

		},
		/********************** Refrsh Functionality********************************/

		/************************Table Row visibility function********************/
		fnCheckTableUi: function() {
			var vTable = this.getView().byId("id_ruleTable");
			var vselectedIndex = vTable.getSelectedIndex();
			if (vselectedIndex >= 0) {
				var vContext = vTable.getContextByIndex(vselectedIndex);
				if (vContext) {
					var vfnmIdvalue = vContext.getProperty("FnmId");
					var vresultmodel = sap.ui.getCore().getModel("JM_FILTEREDRULE");
					var aresults = vresultmodel.getProperty("/results");
					var vTargetField = aresults.find(function(item) {
						return item.FnmId === vfnmIdvalue;
					});
					if (vTargetField && vTargetField.TableUi === 'X') {
						return true;
					}
				}
			}
			return false;

		},
		/************************Table Row visibility function********************/

		/*************************Create New Rule Data***************************/
		fnCreateNewRuleData: function() {
			// if (!this.fnValidateRuleInputs() || !this.fnCheckDuplicates()) {
			if (!this.fnValidateRuleInputs()) {
				return;
			}
			var vRulesetTable = this.getView().byId("id_ruleTable");
			var vSelectedIndex = vRulesetTable.getSelectedIndex();
			this.previndex = vRulesetTable.getSelectedIndex();
			if (vSelectedIndex === -1) {
				ErrorHandler.showCustomSnackbar(
					i18n.getText("PleaseSaveAndSelectRuleset"),
					"Information",
					this
				);

				return;
			}
			var that = this;
			var vappid = this.getView().byId("RID_MASTER").getValue().split("-")[0].trim();
			var vscritem = this.getView().byId("id_Screen").getValue().split("-")[0].trim();
			var vtableContext = vRulesetTable.getContextByIndex(vSelectedIndex);
			var vselectedRuleHeader = vRulesetTable.getModel("JM_Rules").getProperty(vtableContext.getPath());
			var vModel = this.getOwnerComponent().getModel("JMConfig");
			busyDialog.open();
			vModel.read("/RulehSet", {
				filters: [new Filter("AppId", FilterOperator.EQ, vappid),
					new Filter("Fgroup", FilterOperator.EQ, vscritem)
				],
				success: function(oData) {
					var vexistingRules = oData.results;
					busyDialog.close();
					var vcre = vexistingRules.some(function(rule) {
						return vselectedRuleHeader.FmmDes === rule.FmmDes;
					});
					if (vcre) {
						var itemModel = that.getView().getModel("JM_RuleData");
						var existingItems = itemModel.getData();
						var hasSavedRuleWithoutChildren = existingItems.some(function(rule) {
							return rule.Input && rule.Input.length === 0;
						});

						if (hasSavedRuleWithoutChildren) {
							ErrorHandler.showCustomSnackbar(
								i18n.getText("CannotAddRuleSavedRuleNoInputs"),
								"Warning",
								that
							);

							return;
						}
						var newRuleId = existingItems.length > 0 ? (parseInt(existingItems[existingItems.length - 1].RuleId, 10) + 1).toString().padStart(
							5, "0") : "00001";

						var newTableRowId = "";
						if (that.fnCheckTableUi()) {
							newTableRowId = (existingItems.length + 1).toString();
						}
						/************Btn enable pending****************/
						var vEnableModel = that.getView().getModel("JM_Enabled");
						if (newRuleId === "00001") {
							vEnableModel.setProperty("/Add", true);
							vEnableModel.setProperty("/Remove", true);
							vEnableModel.setProperty("/Create", false);
							vEnableModel.setProperty("/Copy", true);
							vEnableModel.setProperty("/Save", true);
							vEnableModel.setProperty("/Delete", true);
							vEnableModel.setProperty("/Refresh", true);

						} else {
							vEnableModel.setProperty("/Add", false); // Disabling creation for "002"
							vEnableModel.setProperty("/Remove", false);
							vEnableModel.setProperty("/Copy", true);
							vEnableModel.setProperty("/Save", true);
							vEnableModel.setProperty("/Delete", true);
							vEnableModel.setProperty("/Refresh", true);

						}
						/************Btn enable pending****************/
						var newRuleItem = {
							"RuleId": newRuleId,
							"RuleSetId": vselectedRuleHeader.RuleSetId,
							"Fnm": vselectedRuleHeader.Fnm,
							"Value": "",
							"RuleText": "",
							"Ftype": "R",
							"FmmDes": vselectedRuleHeader.FmmDes,
							"FnmId": vselectedRuleHeader.FnmId,
							"TableRow": newTableRowId,
							"isNew": true,
							"ChangeInd": false

						};

						existingItems.push(newRuleItem);
						itemModel.setProperty("/", existingItems);
						that.hasUnsavedChanges = true;
						var vRuleDataTable = that.getView().byId("id_datatable");
						vRuleDataTable.collapseAll();
						var vNewIndex = existingItems.length - 1;
						vRuleDataTable.setSelectedIndex(vNewIndex);
						vRuleDataTable.setFirstVisibleRow(vNewIndex);
						var lastRuleWithChildren = existingItems[existingItems.length - 2]; // Last rule before the new one
						if (lastRuleWithChildren && lastRuleWithChildren.Input && lastRuleWithChildren.Input.length > 0) {
							var copiedChildren = JSON.parse(JSON.stringify(lastRuleWithChildren.Input));
							copiedChildren.forEach(function(child) {
								child.RuleId = newRuleId;
								child.Value = "";
								child.RuleText = "";
								child.TableRow = "";
							});

							var newIndex = -1;
							for (var i = 0; i < existingItems.length; i++) {
								if (existingItems[i].RuleId === newRuleId) {
									newIndex = i;
									break;
								}
							}
							if (newIndex !== -1) {
								existingItems[newIndex].Input = copiedChildren;
								itemModel.setProperty("/", existingItems);
							}
						}
					} else {
						ErrorHandler.showCustomSnackbar(
							i18n.getText("PleaseSaveRulesetToProceed"),
							"Information",
							that
						);

					}
				},
				error: function(oResponse) {
					busyDialog.close();
					var sMessage = ErrorHandler.parseODataError(oResponse);
					ErrorHandler.showCustomSnackbar(sMessage, "Error", this);
				}.bind(this)
			});
		},

		fnReadOnlySelect: function(oEvent) {
			var vSelected = oEvent.getParameter("selected");
			var vContext = oEvent.getSource().getBindingContext("JM_RuleData");
			vContext.getModel().setProperty(vContext.getPath() + "/ChangeInd", vSelected);
		},

		fnAddRow: function() {
			var vRuleDataTable = this.getView().byId("id_datatable");
			var vSelectedIndex = vRuleDataTable.getSelectedIndex();
			if (vSelectedIndex === -1) {
				ErrorHandler.showCustomSnackbar(
					i18n.getText("PleaseSelectMainLineItem"),
					"Information",
					this
				);

				return;
			}
			var vContextPath = vRuleDataTable.getContextByIndex(vSelectedIndex).getPath();
			var vpath = vContextPath.split("/");
			if (vpath.length !== 2) {
				ErrorHandler.showCustomSnackbar(
					i18n.getText("PleaseSelectMainLineItem"),
					"Information",
					this
				);

				return;
			}
			var vRuleDataModel = this.getView().getModel("JM_RuleData");
			var vData = vRuleDataModel.getData();
			var vSelectedItem = vData[vSelectedIndex];
			if (!Array.isArray(vSelectedItem.Input)) {
				vSelectedItem.Input = [];
			}
			if (vSelectedItem.Input.length >= 3) {
				ErrorHandler.showCustomSnackbar(
					i18n.getText("MaxThreeInputsPerRule"),
					"Warning",
					this
				);

				return;
			}
			var newInputItem = {
				FmmDes: "",
				Fnm: "",
				FnmId: "",
				Ftype: "I",
				RuleId: vSelectedItem.RuleId,
				RuleSetId: vSelectedItem.RuleSetId,
				Value: "",
				RuleText: ""
			};

			vSelectedItem.Input.push(newInputItem);
			vRuleDataModel.refresh(true);
			vRuleDataTable.expand(vSelectedIndex);

		},

		fnRemoveRow: function(oEvent) {
			var oTable = this.byId("id_datatable");
			var iSelectedIndex = oTable.getSelectedIndex();

			if (iSelectedIndex === -1) {
				ErrorHandler.showCustomSnackbar(
					i18n.getText("PleaseSelectRowFirst"),
					"Information",
					this
				);

				return;
			}

			var oContext = oTable.getContextByIndex(iSelectedIndex);
			var sPath = oContext.getPath();
			var aParts = sPath.split("/");

			// If only parent row is selected
			if (aParts.length === 2) {
				ErrorHandler.showCustomSnackbar(
					i18n.getText("PleaseSelectSubRuleItem"),
					"Information",
					this
				);

				return;
			}

			// If child row is selected â†’ delete
			if (aParts.length === 4) {

				var oModel = oTable.getModel("JM_RuleData");

				// Parent path â†’ "/0/Input"
				var parentPath = "/" + aParts[1] + "/" + aParts[2];

				// Index of child
				var childIndex = aParts[3];

				// Get child array under parent
				var aChildArray = oModel.getProperty(parentPath);

				if (Array.isArray(aChildArray)) {
					aChildArray.splice(childIndex, 1);
				}

				oModel.refresh();
				oTable.setSelectedIndex(-1);
			}
		},
		/*************************Delete child Row************************************/

		/**************************Value SearchHelp******************************/

		fnSearchHelpSearch: function(oEvent) {
			var vValue = oEvent.getParameter("value");
			var oFilter = [
				new Filter("Value1", sap.ui.model.FilterOperator.Contains, vValue),
				new Filter("Value2", sap.ui.model.FilterOperator.Contains, vValue)
			];

			var vBinding = oEvent.getSource().getBinding("items");
			var vFinalFilter = new Filter(oFilter, false);
			vBinding.filter(vFinalFilter);
		},

		fnDatePicker: function(oEvent) {
			var that = this;
			if (this.vDatePicker) {
				this.vDatePicker.destroy();
				this.vDatePicker = null;
			}
			this.vDatePicker = sap.m.DatePicker({
				valueFormat: "yyyy-MM-dd",
				displayFormat: "dd-MM-yyyy",
				change: function(oEvent) {
					var oDate = oEvent.getSource().getDateValue();
					if (oDate && that.vSelectedRowPath) {
						var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
							pattern: "yyyy-MM-dd"
						});
						var sFormattedDate = oDateFormat.format(oDate);
						var oModel = that.getView().getModel("JM_RuleData");
						oModel.setProperty(that.vSelectedRowPath + "/Value", sFormattedDate);
						oModel.setProperty(that.vSelectedRowPath + "/RuleText", ""); // Optional
					}
				}
			});
			this.getView().addDependent(this.vDatePicker);

			setTimeout(function() {
				that.vDatePicker.openBy(oEvent);
			}, 0);
		},

		/**************************Copy Rule Data******************************/
		fnCopyRuleData: function() {
			// if (!this.fnValidateRuleInputs() || !this.fnCheckDuplicates()) {
			if (!this.fnValidateRuleInputs()) {
				return;
			}
			var vRulesetTable = this.getView().byId("id_ruleTable");
			var vRuleDataTable = this.getView().byId("id_datatable");
			var vSelectedIndex = vRuleDataTable.getSelectedIndex();
			if (vSelectedIndex === -1) {
				ErrorHandler.showCustomSnackbar(
					i18n.getText("PleaseSelectLineItem"),
					"Information",
					this
				);

				return;
			}
			var vContext = vRuleDataTable.getContextByIndex(vSelectedIndex).getPath().split("/");
			if (vContext.length !== 2) {
				ErrorHandler.showCustomSnackbar(
					i18n.getText("PleaseSelectMainLineItem"),
					"Information",
					this
				);

				return;
			}
			this.previndex = vRulesetTable.getSelectedIndex();
			var vSelectedData = [];
			var vRuleDataModel = this.getView().getModel("JM_RuleData").getData();
			var vruleid = vRuleDataModel[vRuleDataModel.length - 1].RuleId;
			var vnewruleid = String(parseInt(vruleid, 10) + 1).padStart(5, "0");
			var vEnableModel = this.getView().getModel("JM_Enabled");

			if (vnewruleid === "00002") {
				vEnableModel.setProperty("/Add", false);
				vEnableModel.setProperty("/Remove", false);
				vEnableModel.setProperty("/Copy", true);
				vEnableModel.setProperty("/Save", true);
				vEnableModel.setProperty("/Delete", true);
				vEnableModel.setProperty("/Refresh", true);

			}
			var newtablerow = "";
			if (this.fnCheckTableUi()) {
				var existingItems = vRuleDataModel.filter(function(item) {
					return item && item.TableRow;

				});
				newtablerow = (existingItems.length + 1).toString();
			}
			var vTableContext = vRuleDataTable.getContextByIndex(vSelectedIndex);
			var data = vRuleDataTable.getModel("JM_RuleData").getProperty(vTableContext.getPath());
			vSelectedData.push(data);
			var oModelAData = JSON.parse(JSON.stringify(vSelectedData));
			oModelAData[0].RuleId = vnewruleid;
			oModelAData[0].TableRow = newtablerow;
			oModelAData[0].isNew = true;
			for (var i = 0; i < oModelAData[0].Input.length; i++) {
				oModelAData[0].Input[i].RuleId = vnewruleid;

				if (this.fnCheckTableUi()) {
					oModelAData[0].Input[i].TableRow = "";
				} else {
					oModelAData[0].Input[i].TableRow = newtablerow;
				}
			}
			var oModel = this.getView().getModel("JM_RuleData");
			var aData = oModel.getProperty("/");
			aData.push.apply(aData, oModelAData);

			oModel.setProperty("/", aData);
			this.hasUnsavedChanges = true;
			var vNewIndex = aData.length - 1;
			vRuleDataTable.setSelectedIndex(vNewIndex);
			vRuleDataTable.setFirstVisibleRow(vNewIndex);
		},
		/**************************Copy Rule Data******************************/

		fnRuleDataSave: function() {
			var that = this;
			// if (!that.fnValidateRuleInputs() || !that.fnCheckDuplicates()) {
			if (!that.fnValidateRuleInputs()) {
				return;
			}
			var vData = this.getView().getModel("JM_RuleData").getData();
			var ResArr = [];

			for (var i = 0; i < vData.length; i++) {
				var vrule = vData[i];

				if (Array.isArray(vrule.Input)) {
					vrule.Input.forEach(function(oInp) {
						ResArr.push({
							RuleId: oInp.RuleId,
							RuleSetId: oInp.RuleSetId,
							Fnm: oInp.Fnm,
							Value: oInp.Value,
							RuleText: oInp.RuleText,
							Ftype: oInp.Ftype,
							FmmDes: oInp.FmmDes,
							FnmId: oInp.FnmId,
							TableRow: oInp.TableRow,
							ChangeInd: oInp.ChangeInd ? "X" : ""
						});
					});
				}

				// Push parent rule
				ResArr.push({
					RuleId: vrule.RuleId,
					RuleSetId: vrule.RuleSetId,
					Fnm: vrule.Fnm,
					Value: vrule.Value,
					RuleText: vrule.RuleText,
					Ftype: vrule.Ftype,
					FmmDes: vrule.FmmDes,
					FnmId: vrule.FnmId,
					TableRow: vrule.TableRow,
					ChangeInd: vrule.ChangeInd ? "X" : ""
				});
			}

			var vNavh = {
				"Flag": "V",
				"NavRuleI": ResArr,
				"NavReturnMsg": []
			};

			var vModel = this.getOwnerComponent().getModel("JMConfig");
			busyDialog.open();
			vModel.create("/DeepRuleSet", vNavh, {
				success: function(oData) {
					busyDialog.close();
					if (oData.NavReturnMsg.results[0].MsgType === "E") {

						var sMessages = oData.NavReturnMsg.results || [];
						var Status = sMessages[0].MsgType;

						var oTable = that.getView().byId("id_datatable");
						var oTableModel = oTable.getModel("JM_RuleData");
						var aTableData = oTableModel.getData();
						var aErrorRows = [];
						aTableData.forEach(function(oParent, pIdx) {

							oTableModel.setProperty("/" + pIdx + "/Value_VS", "None");
							oTableModel.setProperty("/" + pIdx + "/Value_VST", "");

							if (Array.isArray(oParent.Input)) {
								oParent.Input.forEach(function(oChild, cIdx) {
									oTableModel.setProperty("/" + pIdx + "/Input/" + cIdx + "/Value_VS", "None");
									oTableModel.setProperty("/" + pIdx + "/Input/" + cIdx + "/Value_VST", "");
								});
							}
						});
						oTable.clearSelection();
						oTable.removeStyleClass("cl_TblErrorHighLight");

						sMessages.forEach(function(oMsg) {

							aTableData.forEach(function(oParent, pIndex) {

								// Match ItemNo
								if (Number(oParent.RuleId) !== Number(oMsg.ItemNo)) { //added by srikanth
									return;
								}

								// =====================================================
								// CASE 1 : FIELD LEVEL ERROR (FnmId exists)
								// =====================================================
								if (oMsg.FnmId) {

									// ---- CHILD ----
									if (Array.isArray(oParent.Input)) {

										oParent.Input.forEach(function(oChild, cIndex) {

											if (oChild.FnmId === oMsg.FnmId) {

												var sChildPath = "/" + pIndex + "/Input/" + cIndex;

												oTableModel.setProperty(sChildPath + "/Value_VS", "Error");
												oTableModel.setProperty(sChildPath + "/Value_VST", oMsg.Message);

												aErrorRows.push({
													field: oMsg.FnmId,
													Message: oMsg.Message,
													row: oMsg.ItemNo,
													TableId: "id_datatable"
												});
											}
										});
									}

									// ---- PARENT ----
									if (oParent.FnmId === oMsg.FnmId) {

										var sRoot = "/" + pIndex;

										oTableModel.setProperty(sRoot + "/Value_VS", "Error");
										oTableModel.setProperty(sRoot + "/Value_VST", oMsg.Message);

										aErrorRows.push({
											field: oMsg.FnmId,
											Message: oMsg.Message,
											row: oMsg.ItemNo,
											TableId: "id_datatable"
										});
									}

								}

								// =====================================================
								// CASE 2 : RULE LEVEL ERROR (FnmId EMPTY)
								// =====================================================
								else {

									aErrorRows.push({
										field: "",
										Message: oMsg.Message,
										row: oMsg.ItemNo,
										TableId: "id_datatable"
									});
								}

							});
						});

						oTableModel.refresh(true);
						that.fnshowError(aErrorRows);
					} else {
						var vConfirmModel = new sap.ui.model.json.JSONModel({
							headerText: "Confirmation",
							confirmationText: "Are you sure you want to save rule data?",
							positiveText: "Yes",
							negativeText: "No",
							positiveIcon: that.fnImageload("Apply"),
							negativeIcon: that.fnImageload("Cancel"),
							action: "SaveRuleData"
						});
						that.getView().setModel(vConfirmModel, "JM_Confirm");
						if (!that.confirmfrag) {
							that.confirmfrag = sap.ui.xmlfragment("WF_RLS.Fragment.Confirmation", that);
							that.getView().addDependent(that.confirmfrag);

						}
						that.confirmfrag.open();

					}

				},
				error: function(oResponse) {
					busyDialog.close();
					var sMessage = ErrorHandler.parseODataError(oResponse);
					ErrorHandler.showCustomSnackbar(sMessage, "Error", this);
				}.bind(this)

			});
		},
		fnSaveRuleData: function() {
			var that = this;

			if (!that.fnValidateRuleInputs()) {
				return;
			}
			var vData = this.getView().getModel("JM_RuleData").getData();
			var ResArr = [];

			for (var i = 0; i < vData.length; i++) {
				var vrule = vData[i];

				if (Array.isArray(vrule.Input)) {
					vrule.Input.forEach(function(oInp) {
						ResArr.push({
							RuleId: oInp.RuleId,
							RuleSetId: oInp.RuleSetId,
							Fnm: oInp.Fnm,
							Value: oInp.Value,
							RuleText: oInp.RuleText,
							Ftype: oInp.Ftype,
							FmmDes: oInp.FmmDes,
							FnmId: oInp.FnmId,
							TableRow: oInp.TableRow,
							ChangeInd: oInp.ChangeInd ? "X" : ""
						});
					});
				}

				// Push parent rule
				ResArr.push({
					RuleId: vrule.RuleId,
					RuleSetId: vrule.RuleSetId,
					Fnm: vrule.Fnm,
					Value: vrule.Value,
					RuleText: vrule.RuleText,
					Ftype: vrule.Ftype,
					FmmDes: vrule.FmmDes,
					FnmId: vrule.FnmId,
					TableRow: vrule.TableRow,
					ChangeInd: vrule.ChangeInd ? "X" : ""
				});
			}

			var vNavh = {
				"Flag": "I",
				"NavRuleI": ResArr,
				"NavReturnMsg": []
			};

			var vModel = this.getOwnerComponent().getModel("JMConfig");
			busyDialog.open();
			vModel.create("/DeepRuleSet", vNavh, {
				success: function(oData) {
					busyDialog.close();
						var oTable = that.getView().byId("id_datatable");
						oTable.clearSelection();
						oTable.removeStyleClass("cl_TblErrorHighLight");

					ErrorHandler.showCustomSnackbar(oData.NavReturnMsg.results[0].Message, "Success", that);
					that.fnProcessSelection();
					that.hasUnsavedChanges = false;
					that.getView().getModel("JM_Enabled").setProperty("/Create", true);
					that.getView().getModel("JM_Enabled").setProperty("/Add", false);
					that.getView().getModel("JM_Enabled").setProperty("/Remove", false);
					that.getView().getModel("JM_Enabled").setProperty("/Mass", true);

				},
				error: function(oResponse) {
					busyDialog.close();
					var sMessage = ErrorHandler.parseODataError(oResponse);
					ErrorHandler.showCustomSnackbar(sMessage, "Error", this);
				}.bind(this)

			});
		},

		/**************************Delete Rule Data******************************/
		fnRemoveRuleData: function() {
			var vRuledataTable = this.getView().byId("id_datatable");
			var vSelectedIndex = vRuledataTable.getSelectedIndex();
			if (vSelectedIndex === -1) {
				ErrorHandler.showCustomSnackbar(
					i18n.getText("PleaseSelectRuleData"),
					"Information",
					this
				);

				return;
			}
			var vContext = vRuledataTable.getContextByIndex(vSelectedIndex).getPath().split('/');
			if (vContext.length !== 2) {
				ErrorHandler.showCustomSnackbar(
					i18n.getText("PleaseSelectMainRuleItem"),
					"Information",
					this
				);

				return;

			}
			var vTableContext = vRuledataTable.getContextByIndex(vSelectedIndex);
			var data = vRuledataTable.getModel("JM_RuleData").getProperty(vTableContext.getPath());
			var vAllData = vRuledataTable.getModel("JM_RuleData").getProperty("/");

			if (data.TableRow !== "00") {
				if (vSelectedIndex !== vAllData.length - 1) {
					ErrorHandler.showCustomSnackbar(
						i18n.getText("OnlyLastRuleItemDeletable"),
						"Warning",
						this
					);

					return;
				}

			}
			var vConfirmModel = new sap.ui.model.json.JSONModel({
				headerText: "Confirmation",
				confirmationText: "Are you sure you want to Delete?",
				positiveText: "Yes",
				negativeText: "No",
				positiveIcon: this.fnImageload("Apply"),
				negativeIcon: this.fnImageload("Cancel"),
				action: "DeleteRuleData"
			});
			this.getView().setModel(vConfirmModel, "JM_Confirm");
			if (!this.confirmfrag) {
				this.confirmfrag = sap.ui.xmlfragment("WF_RLS.Fragment.Confirmation", this);
				this.getView().addDependent(this.confirmfrag);

			}
			this.confirmfrag.open();
		},
		fnDeleteRuleData: function(oEvent) {
			var vRuledataTable = this.getView().byId("id_datatable");
			var vSelectedIndex = vRuledataTable.getSelectedIndex();
			var vTableContext = vRuledataTable.getContextByIndex(vSelectedIndex);
			var vData = [];
			vData.push(vRuledataTable.getModel("JM_RuleData").getProperty(vTableContext.getPath()));
			var ResArr = [];

			for (var i = 0; i < vData.length; i++) {
				var vrule = vData[i];

				if (Array.isArray(vrule.Input)) {
					vrule.Input.forEach(function(oInp) {
						ResArr.push({
							RuleId: oInp.RuleId,
							RuleSetId: oInp.RuleSetId,
							Fnm: oInp.Fnm,
							Value: oInp.Value,
							RuleText: oInp.RuleText,
							Ftype: oInp.Ftype,
							FmmDes: oInp.FmmDes,
							FnmId: oInp.FnmId,
							TableRow: oInp.TableRow,
							ChangeInd: oInp.ChangeInd ? "X" : ""
						});
					});
				}

				ResArr.push({
					RuleId: vrule.RuleId,
					RuleSetId: vrule.RuleSetId,
					Fnm: vrule.Fnm,
					Value: vrule.Value,
					RuleText: vrule.RuleText,
					Ftype: vrule.Ftype,
					FmmDes: vrule.FmmDes,
					FnmId: vrule.FnmId,
					TableRow: vrule.TableRow,
					ChangeInd: vrule.ChangeInd ? "X" : ""
				});
			}

			var vNavh = {
				"Flag": "L",
				"NavRuleI": ResArr
			};
			var that = this;
			var vModel = this.getOwnerComponent().getModel("JMConfig");
			busyDialog.open();
			vModel.create("/DeepRuleSet", vNavh, {
				success: function() {
					busyDialog.close();
					ErrorHandler.showCustomSnackbar(
						i18n.getText("RuleDataDeletedSuccessfully"),
						"Success",
						that
					);

					that.fnProcessSelection(oEvent);
					that.fnCheckTable();

				},
				error: function(oError) {
					busyDialog.close();
					ErrorHandler.showCustomSnackbar(
						i18n.getText("ErrorDeletingRuleData"),
						"Error",
						that
					);

				}
			});

		},

		/**************************Delete Rule Data******************************/

		/**************************Toggle Button Enable Mode based on Deletion mode*****************************/
		fnCheckTable: function() {
			var vRuleDataModel = this.getView().getModel("JM_RuleData");
			var aData = vRuleDataModel.getProperty("/");
			if (!aData || aData.length === 0) {
				this.getView().getModel("JM_Enabled").setProperty("/canCreateRule", true);
				this.getView().getModel("JM_Enabled").setProperty("/Add", false);
				this.getView().getModel("JM_Enabled").setProperty("/Remove", false);
				this.getView().getModel("JM_Enabled").setProperty("/Save", false);
				this.getView().getModel("JM_Enabled").setProperty("/Delete", false);
				this.getView().getModel("JM_Enabled").setProperty("/Refresh", false);
				this.getView().getModel("JM_Enabled").setProperty("/Copy", false);
			} else if (aData.length === 1) {
				this.getView().getModel("JM_Enabled").setProperty("/Add", true);
				this.getView().getModel("JM_Enabled").setProperty("/Remove", true);
			}
		},
		/**************************Toggle Button Enable Mode based on Deletion mode*****************************/

		// convert values to UpperCase
		fnUpperCase: function(oEvent) {
			var input = oEvent.getSource();
			input.setValue(input.getValue().toUpperCase());
		},
		// Validations required for rule Data&nbsp;
		fnValidateRuleInputs: function() {
			var that = this;
			var vRuleData = this.getView().getModel("JM_RuleData").getData();
			for (var i = 0; i < vRuleData.length; i++) {
				var vRule = vRuleData[i];
				var vInput = vRule.Input;
				if (!vRule.Value || vRule.Value.trim() === "") {
					ErrorHandler.showCustomSnackbar(
						i18n.getText("PleaseFillRuleDataValue"),
						"Warning",
						that
					);

					return false;
				}
				if (Array.isArray(vInput) && vInput.length > 0) {
					for (var j = 0; j < vInput.length; j++) {
						var vChild = vInput[j];
						var vAllowEmpty = vChild.RuleText === "No" && vInput.length === 1;
						if (!vChild.Fnm || vChild.Value.trim() === "" || (!vAllowEmpty && !vChild.Value) || (!vAllowEmpty && vChild.Value.trim() ===
								"")) {
							ErrorHandler.showCustomSnackbar(
								i18n.getText("PleaseFillAllChildRows"),
								"Warning",
								that
							);

							return false;
						}
					}
				}
			}
			return true;
		},

		/*********************	Confirmation popup*******************************/
		fnConfirmSubmit: function() {
			var vModel = this.getView().getModel("JM_Confirm");
			var vAction = vModel.getProperty("/action");
			this.confirmfrag.close();
			switch (vAction) {
				case "SaveRuleSet":
					this.fnRulesetSave();
					break;
				case "DeleteRuleSet":
					this.fnDeleteRuleSet();
					break;
				case "DeleteRuleData":
					this.fnDeleteRuleData();
					break;
				case "SaveRuleData":
					this.fnSaveRuleData();
					break;
				case "UnsavedData":
					this.fnUnsavedPopup();
					break;
				case "SaveMassRules":
					this.fnSaveMassRulesData();
					break;
			}
		},
		fnConfirmExit: function() {
			var vModel = this.getView().getModel("JM_Confirm");
			var vAction = vModel.getProperty("/action");
			if (vAction === "UnsavedData") {
				var oTable = this.getView().byId("id_ruleTable");
				oTable.setSelectedIndex(this.previndex);
			}

			this.confirmfrag.close();
		},

		fnNavigateToView: function(oEvent) {
			var id = oEvent.getSource().getId().split("--")[1];

			if (id === "id_uwl") {
				sap.m.URLHelper.redirect(
					"http://hd1sap.exalca.com:8000/sap/bc/ui5_ui5/sap/zmds_mm_v1/index.html?sap-client=300&sap-ui-language=EN&sap-ui-xx-devmode=true#/UWL",
					false);
			}
			if (id === "id_material") {
				sap.m.URLHelper.redirect(
					"http://hd1sap.exalca.com:8000/sap/bc/ui5_ui5/sap/zmds_mm_v1/index.html?sap-client=300&sap-ui-language=EN&sap-ui-xx-devmode=true#",
					false);
			}
			if (id === "id_dashBoard") {
				sap.m.URLHelper.redirect(
					"http://hd1sap.exalca.com:8000/sap/bc/ui5_ui5/sap/zmds_mm_v1/index.html?sap-client=300&sap-ui-language=EN&sap-ui-xx-devmode=true#/Dashboard",
					false);
			}

			if (id === "id_workFlow") {
				sap.m.URLHelper.redirect(
					"http://hd1sap.exalca.com:8000/sap/bc/ui5_ui5/sap/zwf_rules_v2/index.html?sap-client=300&sap-ui-language=EN&sap-ui-xx-devmode=true#/Workflow",
					false);
			}
			if (id === "id_RulesEngine") {

				sap.m.URLHelper.redirect(
					"http://hd1sap.exalca.com:8000/sap/bc/ui5_ui5/sap/zwf_rules_v2/index.html?sap-client=300&sap-ui-language=EN&sap-ui-xx-devmode=true#/RulesEngine",
					false);
			}
		},

		fnNavExpandList: function(oEvent) {
			var id = oEvent.getSource().getId().split("--")[1];

			if (id === "id_appList") {
				this.getView().byId("id_appList_i").setVisible(true);
			}

		},
		/*********************** Navigation Functionalities********************************/
		fnNavBack: function() {
			sap.ui.core.UIComponent.getRouterFor(this).navTo("HomePage");

			["JM_Rules", "JM_RuleData", "JM_FILTEREDRULE", "JM_MassRuleData", "JM_SearchHelpResult"].forEach(function(item) {
				var oModel = this.getView().getModel(item);
				if (oModel) {
					oModel.setData([]);
					oModel.refresh();
					this.getView().setModel(null, item);
				}
			}.bind(this));
			this.getView().byId("RID_MASTER").setValue("");
			this.getView().byId("id_Screen").setValue("");
		},

		// ***************************************************************************************************
		//								Mass Rules functionality - Added by srikanth 
		// ****************************************************************************************************
		fnMassRule: function() {
			var TreeTable = this.getView().byId("id_datatable");
			TreeTable.removeStyleClass("cl_TblErrorHighLight");
			var iTIndex = TreeTable.getSelectedIndex();

			if (iTIndex < 0) {
				ErrorHandler.showCustomSnackbar(
					i18n.getText("PleaseSelectAtLeastOneRuleForMassRule"),
					"Error",
					this
				);

				return;
			}

			var StructData = this.fnGetRulesStructure();
			this.FilteredStructure = JSON.parse(JSON.stringify(StructData.FilteredData));
			// this.MaxRuleId = StructData.iMaxRuleId;

			var oF4Model = sap.ui.getCore().getModel("JM_FILTEREDRULE");
			var aF4Data = oF4Model.getProperty("/results") || [];

			var aResult = [];

			this.FilteredStructure.forEach(function(oRule) {
				var oMatch = aF4Data.find(function(oF4) {
					return oF4.FnmId === oRule.FnmId;
				});
				if (oMatch) {
					aResult.push({
						FnmId: oMatch.FnmId,
						Fnm: oMatch.Fnm,
						Process: oMatch.Process,
						SearchHelp: oMatch.SearchHelp
					});
				}

			});

			this.F4PayLoad = aResult;
			this.fnGetDescriptionData(this.F4PayLoad);

			var oTreeModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(oTreeModel, "JM_MassRuleData");

			var oTable = this.getView().byId("id_ruleTable");
			var iIndex = oTable.getSelectedIndex();

			if (iIndex < 0) {
				ErrorHandler.showCustomSnackbar(
					i18n.getText("PleaseSelectRuleSet"),
					"Error",
					this
				);

				return;
			}

			var oRuleSet = this.getView().getModel("JM_Rules").getProperty(oTable.getContextByIndex(iIndex).getPath());
			if (!this.MassRuleFrag) {
				this.MassRuleFrag = sap.ui.xmlfragment("ID_MASSRULES", "WF_RLS.fragment.MassRules", this);
				this.getView().addDependent(this.MassRuleFrag);
			}

			this.MassRuleFrag.open();

			sap.ui.core.Fragment.byId("ID_MASSRULES", "ID_MassHdrTxt").setText("Mass Rules - " + oRuleSet.FmmDes);

		},
		fnGetDescriptionData: function(aResult) {
			var oModel = this.getOwnerComponent().getModel("JMConfig");
			var that = this;

			var oResultById = {};

			busyDialog.open();

			var fnCreateSequential = function(i) {

				if (i >= aResult.length) {

					busyDialog.close();

					var oNewModel = new sap.ui.model.json.JSONModel(oResultById);
					that.getView().setModel(oNewModel, "JM_SearchHelpResult");

					return;
				}

				var oPayload = {
					FieldId: aResult[i].FnmId,
					Process: aResult[i].Process,
					F4Type: aResult[i].SearchHelp,
					NavSerchResult: []
				};

				oModel.create("/SearchHelpSet", oPayload, {

					success: function(oData) {

						oResultById[aResult[i].Fnm] = oData;

						fnCreateSequential(i + 1);
					},

					error: function() {

						fnCreateSequential(i + 1);
					}
				});
			};

			fnCreateSequential(0);

		},
		fnConfirmCloseMassRule: function() {
			if (this.MassRuleFrag) {
				this.MassRuleFrag.close();
				this.MassRuleFrag.destroy();
				this.MassRuleFrag = null;
			}

		},

		fnGetRulesStructure: function() {

			var aTreeTable = this.getView().byId("id_datatable");
			var oModel = this.getView().getModel("JM_RuleData");

			var aSelectedIndex = aTreeTable.getSelectedIndex();

			var oContext = aTreeTable.getContextByIndex(aSelectedIndex);
			var RulesData = oModel.getProperty(oContext.getPath());

			var vRulesetModel = this.getView().getModel("JM_RuleItems");
			if (!vRulesetModel) {
				return;
			}

			var vRuleset = vRulesetModel.getProperty("/RuleSet") || [];

			var FilteredData = vRuleset.filter(function(item) {
				return item.RuleId === RulesData.RuleId;
			});

			return {
				FilteredData: FilteredData

			};
		},

		fnDownloadMassRules: function() {

			var oCountInput = sap.ui.core.Fragment.byId("ID_MASSRULES", "ID_COUNT_MASS");
			var iCount = parseInt(oCountInput.getValue(), 10);

			if (!iCount || iCount <= 0) {
				oCountInput.setValueState("Error");
				// oCountInput.setValueStateText("Please Enter Count");
				oCountInput.setValueStateText(i18n.getText("PleaseEnterCount"));
				return;
			}
			oCountInput.setValueState("None");

			var FilteredData = this.FilteredStructure;
			FilteredData.forEach(function(o) {
				o.Value = "";
				o.RuleId = "";
				o.RuleText = "";
				o.ChangeInd = "";
			});

			FilteredData.sort(function(a, b) {
				if (a.Ftype === b.Ftype) {
					return 0;
				}
				return a.Ftype === "R" ? -1 : 1;
			});

			var aFinalData = [];

			for (var i = 0; i < iCount; i++) {
				FilteredData.forEach(function(item) {
					var oNew = Object.assign({}, item);
					oNew.ItemNo = String(i + 1).padStart(4, "0");
					oNew.RuleText = "";
					oNew.Value = "";
					oNew.TableRow = "00";
					oNew.Ftype = item.Ftype === "I" ? "INPUT" : "OUTPUT";
					aFinalData.push(oNew);
				});
			}

			if (!aFinalData.length) {
				return;
			}

			var aExportData = aFinalData.map(function(item) {
				return {
					"Serial No": item.ItemNo,
					"Function Type": item.Ftype,
					// "Field Name": item.Fnm,
					"Description": item.FmmDes,
					// "RuleSet Id": item.RuleSetId,
					"Value": item.Value,
					"Read Only": item.ChangeInd
				};
			});

			var oWorksheet = XLSX.utils.json_to_sheet(aExportData);
			var aHeaders = Object.keys(aExportData[0]);
			var range = XLSX.utils.decode_range(oWorksheet["!ref"]);

			for (var R = range.s.r + 1; R <= range.e.r; ++R) {
				var cellAddr = XLSX.utils.encode_cell({
					r: R,
					c: 3
				});
				if (oWorksheet[cellAddr]) {
					oWorksheet[cellAddr].t = "s";
					oWorksheet[cellAddr].z = "@";
					oWorksheet[cellAddr].v = String(oWorksheet[cellAddr].v || "");
				}
			}

			oWorksheet["!autofilter"] = {
				ref: "A1:" + XLSX.utils.encode_col(aHeaders.length - 1) + "1"
			};
			var oWorkbook = XLSX.utils.book_new();

			XLSX.utils.book_append_sheet(oWorkbook, oWorksheet, "Mass Rules");

			XLSX.writeFile(oWorkbook, "Mass_Rules.xlsx");
			// oCountInput.setValue("");
		},
		fnUpload: function() {

			var oFileUploader = sap.ui.core.Fragment.byId("ID_MASSRULES", "FileUploaderId");
			if (oFileUploader) {
				var oDomRef = oFileUploader.getFocusDomRef();
				if (oDomRef) {
					oDomRef.click();
				}
			}
		},

		fnFileSelect: function(oEvent) {
			var that = this;
			var oFileUploader = sap.ui.core.Fragment.byId("ID_MASSRULES", "FileUploaderId");;
			var oFile = oEvent.getParameter("files")[0];
			if (oFile) {
				if (oFile.size > 2 * 1024 * 1024) {
					ErrorHandler.showCustomSnackbar(i18n.getText("document_size_validation"), "Information", this);
					oFileUploader.setValue("");
					return;
				}
				var reader = new FileReader();
				reader.onload = function(e) {
					var sBase64 = e.target.result.split(",")[1];

					var oModel = that.getView().getModel("JMUploadFileModel");
					if (!oModel) {
						oModel = new sap.ui.model.json.JSONModel({
							FileName: "",
							uploadedFileContent: "",
							uploadedMimeType: "",
							uploadedFileSize: ""
						});
						that.getView().setModel(oModel, "JMUploadFileModel");
					}
					oModel.setProperty("/FileName", oFile.name);
					oModel.setProperty("/uploadedFileContent", sBase64);
					oModel.setProperty("/uploadedMimeType", oFile.type);
					oModel.setProperty("/uploadedFileSize", oFile.size);
					sap.ui.core.Fragment.byId("ID_MASSRULES", "id_fileNameInput").setValue(oFile.name);
				};
				reader.readAsDataURL(oFile);
			}
		},

		fnExcelUpload: function() {

			var oView = this.getView();

			var oFileUploader = sap.ui.core.Fragment.byId("ID_MASSRULES", "FileUploaderId");
			var oFile = oFileUploader.oFileUpload.files[0];

			if (!oFile) {
				ErrorHandler.showCustomSnackbar(i18n.getText("No_file_error"), "Error", this);
				return;
			}

			var that = this;
			var reader = new FileReader();

			reader.onload = function(event) {
				busyDialog.open();

				var workbook = XLSX.read(event.target.result, {
					type: "binary"
				});
				var sheet = workbook.Sheets[workbook.SheetNames[0]];
				var excelData = XLSX.utils.sheet_to_json(sheet);

				var aCleanExcelData = excelData.map(function(oRow) {
					var oCleanRow = {};
					Object.keys(oRow).forEach(function(k) {
						oCleanRow[k.replace(/\*/g, "").trim()] = oRow[k];
					});
					return oCleanRow;
				});

				var vRulesetOutputs = [];
				var vRulesetInputs = [];
				var vRuleData = [];

				var oF4DataModel = that.getView().getModel("JM_SearchHelpResult");
				if (!oF4DataModel) {
					return;
				}

				var oF4Data = oF4DataModel.getData();
				var aF4 = that.F4PayLoad;

				var aFiltered = aCleanExcelData.filter(function(o) {
					return o["Serial No"] && o["Serial No"].trim() !== "";
				});

				var aUniqueDesc = [];

				aFiltered.forEach(function(o) {
					if (aUniqueDesc.indexOf(o.Description) === -1) {
						aUniqueDesc.push(o.Description);
					}
				});

				var oStructMap = {};

				that.FilteredStructure.forEach(function(o) {
					oStructMap[o.FmmDes] = o;
				});

				var aStructKeys = Object.keys(oStructMap);

				var bMismatch = aUniqueDesc.some(function(sDesc) {
					return !oStructMap[sDesc];
				});

				if (!bMismatch && aStructKeys.length !== aUniqueDesc.length) {
					bMismatch = true;
				}

				if (bMismatch) {
					busyDialog.close();
					sap.ui.core.Fragment.byId("ID_MASSRULES", "id_fileNameInput").setValue("");
					ErrorHandler.showCustomSnackbar(
						i18n.getText("PleaseUploadValidExcelFile"),
						"Error",
						that
					);

					return;
				}

				var aRuleData = aFiltered.map(function(item) {

					var bReadOnly =
						item["Read Only"] === "X" ||
						item["Read Only"] === true ||
						item["Read Only"] === "true";

					var FunctionType = item["Function Type"] === "INPUT" ? "I" : "R";

					var sValue = item["Value"] ? String(item["Value"]).toUpperCase() : "";
					var sDesc = item["Description"];

					var oMatchStruct = oStructMap[sDesc] || {};

					var sFnm = oMatchStruct.Fnm || "";
					var sFnmId = oMatchStruct.FnmId || "";
					var sRuleSetId = oMatchStruct.RuleSetId || "";

					var oFnmMatch = aF4.find(function(o) {
						return o.Fnm === sFnm;
					});
					if (oFnmMatch) {
						sFnmId = oFnmMatch.FnmId;
					}
					var sRuleText = "";

					if (
						oF4Data[sFnm] &&
						oF4Data[sFnm].NavSerchResult &&
						oF4Data[sFnm].NavSerchResult.results
					) {

						var aResults = oF4Data[sFnm].NavSerchResult.results;

						var oMatch = aResults.find(function(o) {
							return o.Value1 === sValue;
						});

						if (oMatch) {
							sRuleText = oMatch.Value2 || "";
						}
					}

					return {
						Fnm: sFnm,
						FnmId: sFnmId,
						FmmDes: sDesc,
						Ftype: FunctionType,
						ItemNo: item["Serial No"],
						RuleSetId: sRuleSetId,
						Value: sValue,
						ChangeInd: bReadOnly ? "X" : "",
						RuleText: sRuleText,
						TableRow: "00"
					};
				});

				aRuleData.sort(function(a, b) {
					return Number(a.ItemNo) - Number(b.ItemNo);
				});

				aRuleData.forEach(function(o) {

					if (o.Ftype === "R") {
						vRulesetOutputs.push(o);
					} else if (o.Ftype === "I") {
						vRulesetInputs.push(o);
					}

				});

				vRulesetOutputs.forEach(function(oOutput) {

					var aInput = [];

					vRulesetInputs.forEach(function(oInput) {

						if (oInput.ItemNo === oOutput.ItemNo) {

							aInput.push({
								ItemNo: oInput.ItemNo,
								FmmDes: oInput.FmmDes,
								Fnm: oInput.Fnm,
								FnmId: oInput.FnmId,
								Ftype: oInput.Ftype,
								RuleSetId: oInput.RuleSetId,
								Value: oInput.Value,
								RuleText: oInput.RuleText
							});
						}

					});

					vRuleData.push({
						ItemNo: oOutput.ItemNo,
						FmmDes: oOutput.FmmDes,
						Fnm: oOutput.Fnm,
						FnmId: oOutput.FnmId,
						Ftype: oOutput.Ftype,
						RuleSetId: oOutput.RuleSetId,
						Value: oOutput.Value,
						RuleText: oOutput.RuleText,
						TableRow: oOutput.TableRow,
						ChangeInd: oOutput.ChangeInd === "X",
						Input: aInput
					});

				});
				var count = 0;

				vRuleData.forEach(function(parent) {
					if (!parent.Value &&
						Array.isArray(parent.Input) &&
						parent.Input.some(function(child) {
							return !child.Value;
						})
					) {
						count++;
					}
				});

				var AvailableRecords = vRuleData.length - count;

				var oTreeModel = new sap.ui.model.json.JSONModel(vRuleData);
				that.getView().setModel(oTreeModel, "JM_MassRuleData");

				sap.ui.core.Fragment.byId("ID_MASSRULES", "id_fileNameInput").setValue("");
				sap.ui.core.Fragment.byId("ID_MASSRULES", "id_availableRec").setText("(" + AvailableRecords + ")");
				oFileUploader.clear();

				ErrorHandler.showCustomSnackbar(i18n.getText("ExcelUploadedSuccessfully"), "Success", that);
				busyDialog.close();
			};

			reader.readAsBinaryString(oFile);
		},

		fnMassRulesSubmit: function() {

			var PayloadData = this.fnCreatePayload();
			if (!PayloadData) {
				return;
			}

			var aPayload = {
				Flag: "M",
				MsgType: "",
				Message: "",
				NavSearchHelp: PayloadData.SearchHelpData,
				NavRuleh: PayloadData.HeaderData,
				NavRuleI: PayloadData.AllRulesData,
				NavReturnMsg: []
			};

			var that = this;

			var vModel = this.getOwnerComponent().getModel("JMConfig");
			busyDialog.open();
			vModel.create("/DeepRuleSet", aPayload, {
				success: function(oData) {
					busyDialog.close();
					var sMessages = oData.NavReturnMsg.results || [];
					var Status = sMessages[0].MsgType;
					if (Status === "E") {

						var oTable = sap.ui.core.Fragment.byId("ID_MASSRULES", "ID_MASSRULESTABLE");
						var oTableModel = oTable.getModel("JM_MassRuleData");
						var aTableData = oTableModel.getData();
						var aErrorRows = [];
						// Clear old states
						aTableData.forEach(function(oParent, pIdx) {

							oTableModel.setProperty("/" + pIdx + "/Value_VS", "None");
							oTableModel.setProperty("/" + pIdx + "/Value_VST", "");

							if (Array.isArray(oParent.Input)) {
								oParent.Input.forEach(function(oChild, cIdx) {
									oTableModel.setProperty("/" + pIdx + "/Input/" + cIdx + "/Value_VS", "None");
									oTableModel.setProperty("/" + pIdx + "/Input/" + cIdx + "/Value_VST", "");
								});
							}
						});
						oTable.clearSelection();
						oTable.removeStyleClass("cl_TblErrorHighLight");

						sMessages.forEach(function(oMsg) {

							aTableData.forEach(function(oParent, pIndex) {

								// Match ItemNo
								if (Number(oParent.ItemNo) !== Number(oMsg.ItemNo)) {
									return;
								}

								// =====================================================
								// CASE 1 : FIELD LEVEL ERROR (FnmId exists)
								// =====================================================
								if (oMsg.FnmId) {

									// ---- CHILD ----
									if (Array.isArray(oParent.Input)) {

										oParent.Input.forEach(function(oChild, cIndex) {

											if (oChild.FnmId === oMsg.FnmId) {

												var sChildPath = "/" + pIndex + "/Input/" + cIndex;

												oTableModel.setProperty(sChildPath + "/Value_VS", "Error");
												oTableModel.setProperty(sChildPath + "/Value_VST", oMsg.Message);

												aErrorRows.push({
													field: oMsg.FnmId,
													Message: oMsg.Message,
													row: oMsg.ItemNo,
													TableId: "ID_MASSRULESTABLE"
												});
											}
										});
									}

									// ---- PARENT ----
									if (oParent.FnmId === oMsg.FnmId) {

										var sRoot = "/" + pIndex;

										oTableModel.setProperty(sRoot + "/Value_VS", "Error");
										oTableModel.setProperty(sRoot + "/Value_VST", oMsg.Message);

										aErrorRows.push({
											field: oMsg.FnmId,
											Message: oMsg.Message,
											row: oMsg.ItemNo,
											TableId: "ID_MASSRULESTABLE"
										});
									}

								}

								// =====================================================
								// CASE 2 : RULE LEVEL ERROR (FnmId EMPTY)
								// =====================================================
								else {

									aErrorRows.push({
										field: "",
										Message: oMsg.Message,
										row: oMsg.ItemNo,
										TableId: "ID_MASSRULESTABLE"
									});
								}

							});
						});

						oTableModel.refresh(true);
						this.fnshowError(aErrorRows);

					} else {
						var vConfirmModel = new sap.ui.model.json.JSONModel({
							headerText: "Confirmation",
							confirmationText: "Are you sure you want to Submit?",
							positiveText: "Yes",
							negativeText: "No",
							positiveIcon: this.fnImageload("Apply"),
							negativeIcon: this.fnImageload("Cancel"),
							action: "SaveMassRules"
						});
						this.getView().setModel(vConfirmModel, "JM_Confirm");
						if (!this.confirmfrag) {
							this.confirmfrag = sap.ui.xmlfragment("WF_RLS.Fragment.Confirmation", this);
							this.getView().addDependent(this.confirmfrag);

						}
						this.confirmfrag.open();
					}

				}.bind(this),
				error: function(oResponse) {
					busyDialog.close();
					var sMessage = ErrorHandler.parseODataError(oResponse);
					ErrorHandler.showCustomSnackbar(sMessage, "Error", this);
				}.bind(this)
			});
		},

		fnCreatePayload: function() {
			var oView = this.getView();
			var oTable = sap.ui.core.Fragment.byId("ID_MASSRULES", "ID_MASSRULESTABLE");
			oTable.collapseAll();

			var aIndices = oTable.getSelectedIndices();

			if (!aIndices.length) {
				ErrorHandler.showCustomSnackbar(
					i18n.getText("SelectAtLeastOneRuleDataForMassRule"),
					"Error",
					this
				);

				return;
			}

			var oModel = oView.getModel("JM_MassRuleData");
			var aSelectedRules = [];

			aIndices.forEach(function(iIndex) {
				var oContext = oTable.getContextByIndex(iIndex);
				if (oContext) {
					aSelectedRules.push(oModel.getProperty(oContext.getPath()));
				}
			});

			var oMassModel = oView.getModel("JM_MassRuleData");

			var AllRulesData = aSelectedRules.flatMap(function(oRule) {
				var aInputs = (oRule.Input || []).map(function(oInp) {
					return {
						Fnm: oInp.Fnm,
						FnmId: oInp.FnmId,
						FmmDes: oInp.FmmDes,
						Ftype: oInp.Ftype,
						RuleSetId: oInp.RuleSetId,
						RuleText: oInp.RuleText,
						SerialNo: oInp.ItemNo,
						ChangeInd: oInp.ChangeInd ? "X" : "",
						Value: oInp.Value || "",
						TableRow: oInp.TableRow || ""
					};
				});

				var oResult = {
					Fnm: oRule.Fnm,
					FmmDes: oRule.FmmDes,
					FnmId: oRule.FnmId,
					RuleSetId: oRule.RuleSetId,
					RuleText: oRule.RuleText,
					Ftype: oRule.Ftype,
					SerialNo: oRule.ItemNo,
					ChangeInd: oRule.ChangeInd ? "X" : "",
					Value: oRule.Value || "",
					TableRow: oRule.TableRow || ""
				};

				return aInputs.concat(oResult);

			});

			var oTable = oView.byId("id_ruleTable");
			var iIndex = oTable.getSelectedIndex();

			if (iIndex < 0) {
				return false;
			}

			var oRuleSet = oView.getModel("JM_Rules").getProperty(oTable.getContextByIndex(iIndex).getPath());

			var HeaderData = [{
				Fnm: oRuleSet.Fnm,
				Fgroup: oRuleSet.Fgroup,
				RuleSetId: oRuleSet.RuleSetId,
				AppId: oRuleSet.AppId
			}];

			var SearchHelpData = (this.F4PayLoad || []).map(function(item) {
				return {
					FieldId: item.FnmId,
					F4Type: item.SearchHelp,
					Process: item.Process
				};
			});

			return {
				SearchHelpData: SearchHelpData,
				HeaderData: HeaderData,
				AllRulesData: AllRulesData
			};
		},

		fnSaveMassRulesData: function() {
			var PayloadData = this.fnCreatePayload();

			if (!PayloadData) {
				return;
			}

			var aPayload = {
				Flag: "S",
				MsgType: "",
				Message: "",
				NavSearchHelp: PayloadData.SearchHelpData,
				NavRuleh: PayloadData.HeaderData,
				NavRuleI: PayloadData.AllRulesData,
				NavReturnMsg: []
			};

			var vModel = this.getOwnerComponent().getModel("JMConfig");
			busyDialog.open();
			vModel.create("/DeepRuleSet", aPayload, {
				success: function(oData) {
					busyDialog.close();
					var sMessages = oData.NavReturnMsg.results || [];
					if (sMessages[0].MsgType === "S") {
						ErrorHandler.showCustomSnackbar(sMessages[0].Message, "Success", this);
						this.getView().getModel("JM_MassRuleData").setData([]);
						this.getView().setModel(null, "JM_MassRuleData");
						this.fnConfirmCloseMassRule();
						this.fnProcessSelection();
					}

				}.bind(this),
				error: function(oResponse) {
					busyDialog.close();
					var sMessage = ErrorHandler.parseODataError(oResponse);
					ErrorHandler.showCustomSnackbar(sMessage, "Error", this);
				}.bind(this)
			});

		},

		fnshowError: function(aErrors) {
			var oView = this.getView();
			if (!this._oErrorDialog) {
				this._oErrorDialog = sap.ui.xmlfragment(oView.getId(), "WF_RLS.Fragment.ErrorList", this);
				oView.addDependent(this._oErrorDialog);
			}

			var oModel = new sap.ui.model.json.JSONModel({
				rows: aErrors
			});
			oView.setModel(oModel, "JM_ErrorList");

			var oList = sap.ui.core.Fragment.byId(oView.getId(), "idErrorList");
			oList.bindItems({
				path: "JM_ErrorList>/rows",
				template: new sap.m.StandardListItem({
					title: "{JM_ErrorList>Message}",
					type: "Active",
					customData: [
						new sap.ui.core.CustomData({
							key: "field",
							value: "{JM_ErrorList>field}"
						}),
						new sap.ui.core.CustomData({
							key: "row",
							value: "{JM_ErrorList>row}"
						}),
						new sap.ui.core.CustomData({
							key: "TableId",
							value: "{JM_ErrorList>TableId}"
						})
					]
				})
			});

			this._oErrorDialog.open();
		},

		fnErrorDialogClose: function() {
			if (this._oErrorDialog) {
				this._oErrorDialog.close();
				this._oErrorDialog.destroy();
				this._oErrorDialog = null;
			}
		},

		fnErrorSelect: function(oEvent) {

			var oSelectedItem = oEvent.getParameter("listItem");
			if (!oSelectedItem) {
				return;
			}

			// ------------------------------
			// Read Custom Data
			// ------------------------------
			var aCustomData = oSelectedItem.getCustomData();
			var sField = "";
			var sRow = "";
			var sTableId = "";

			aCustomData.forEach(function(oData) {
				if (oData.getKey() === "field") {
					sField = oData.getValue();
				}
				if (oData.getKey() === "row") {
					sRow = oData.getValue();
				}
				if (oData.getKey() === "TableId") {
					sTableId = oData.getValue();
				}
			});

			var oFragmentTable = sap.ui.core.Fragment.byId("ID_MASSRULES", sTableId);
			var oTable = oFragmentTable || this.getView().byId(sTableId);

			var oModel = oTable && oTable.getModel(
				oFragmentTable ? "JM_MassRuleData" : "JM_RuleData"
			);

			if (!oTable || !oModel) {
				return;
			}
			var aData = oModel.getData();

			var iParentIndex = -1;
			var iChildIndex = -1;

			// ------------------------------
			// Find Parent + Child
			// ------------------------------
			aData.some(function(oParent, pIdx) {

				var iRow = Number(sRow);
				var iParent = Number(oFragmentTable ? oParent.ItemNo : oParent.RuleId);

				if (iParent === iRow) {

					iParentIndex = pIdx;

					if (Array.isArray(oParent.Input)) {
						oParent.Input.some(function(oChild, cIdx) {
							if (oChild.FnmId === sField) {
								iChildIndex = cIdx;
								return true;
							}
						});
					}

					return true;
				}

			});

			if (iParentIndex < 0) {
				return;
			}

			var that = this;

			// Child optional
			var bHasChild = iChildIndex >= 0;

			// ------------------------------
			// Accordion collapse others
			// ------------------------------
			aData.forEach(function(oRow, idx) {
				if (idx !== iParentIndex && oTable.isExpanded(idx)) {
					oTable.collapse(idx);
				}
			});

			// ------------------------------
			// Expand Parent
			// ------------------------------
			var bExpanded = oTable.isExpanded(iParentIndex);

			if (!bExpanded) {
				oTable.expand(iParentIndex);
			}

			// ------------------------------
			// Flattened Index
			// ------------------------------
			var iRowIndex = bHasChild ?
				iParentIndex + 1 + iChildIndex :
				iParentIndex;

			// ------------------------------
			// Scroll near row
			// ------------------------------
			oTable.setFirstVisibleRow(Math.max(0, iRowIndex - 2));

			// ------------------------------
			// Highlight parent only case
			// ------------------------------
			if (!bHasChild && !sField) {
				oTable.addStyleClass("cl_TblErrorHighLight");
			}

			// ------------------------------
			// After render
			// ------------------------------
			var fnAfter = function() {
				oTable.detachRowsUpdated(fnAfter);
				that.focusFieldInRow(oTable, iRowIndex, bHasChild);
			};

			setTimeout(fnAfter, 0);

			this.fnErrorDialogClose();
		},

		focusFieldInRow: function(oTable, iRowIndex, bHasChild) {

			oTable.setSelectedIndex(iRowIndex);

			var iFirst = oTable.getFirstVisibleRow();
			var iVisibleIndex = iRowIndex - iFirst;
			var oRow = oTable.getRows()[iVisibleIndex];

			if (!oRow) {
				return;
			}

			// Scroll row
			var oRowDom = oRow.getDomRef();
			if (oRowDom) {
				oRowDom.scrollIntoView({
					behavior: "smooth",
					block: "center"
				});
			}

			// Child → focus input
			if (bHasChild) {

				var aCells = oRow.getCells();

				for (var i = 0; i < aCells.length; i++) {

					if (aCells[i].isA("sap.m.Input")) {

						var oBind = aCells[i].getBinding("value");

						if (oBind && oBind.getPath() === "Value") {
							aCells[i].focus();
							break;
						}
					}
				}
			}
		},

		fnDeleteMassRule: function() {

			var oTable = sap.ui.core.Fragment.byId("ID_MASSRULES", "ID_MASSRULESTABLE");
			oTable.collapseAll();
			if (!oTable) return;

			var aIndices = oTable.getSelectedIndices();

			if (!aIndices.length) {
				ErrorHandler.showCustomSnackbar(
					i18n.getText("PleaseSelectAtLeastOneRuleToDelete"),
					"Error",
					this
				);

				return;
			}

			var oModel = this.getView().getModel("JM_MassRuleData");

			var aPaths = aIndices.map(function(iIndex) {
				return oTable.getContextByIndex(iIndex).getPath();
			});

			aPaths.sort(function(a, b) {
				return b.length - a.length;
			});

			aPaths.forEach(function(sPath) {
				oModel.setProperty(sPath, null);
			});

			// var oData = oModel.getData();
			// this._removeNullNodes(oData);

			oModel.refresh(true);
			oTable.clearSelection();

			ErrorHandler.showCustomSnackbar(
				i18n.getText("RulesRemovedSuccessfully", [aPaths.length]),
				"Success",
				this
			);

		},

		fnMassToggle: function(oEvent) {

			var oBtn = oEvent.getSource();
			var oTable = sap.ui.core.Fragment.byId("ID_MASSRULES", "ID_MASSRULESTABLE");

			var bExpanded = oBtn.data("expanded") || false;

			if (!bExpanded) {
				oTable.expandToLevel(99);
				oBtn.addStyleClass("cl_RotateImage");
				oBtn.setTooltip("Collapse");
			} else {

				oTable.collapseAll();
				oBtn.removeStyleClass("cl_RotateImage");
				oBtn.setTooltip("Expand");
			}

			oBtn.data("expanded", !bExpanded);
		},
		fnImageload: function(text) {
			var oImageModel = this.getView().getModel("JM_ImageModel");
			var sBasePath = oImageModel.getProperty("/path");
			var sImg = text;
			var sSrc = sBasePath + sImg + ".svg";
			return sSrc;
		},

	});

});