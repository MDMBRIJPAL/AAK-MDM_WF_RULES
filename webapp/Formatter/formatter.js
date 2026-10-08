jQuery.sap.declare("WF_RLS.Formatter.formatter");
WF_RLS.Formatter.formatter = {
	changeIndToBoolean: function(value) {
		return value === "X"; // "X" → true, "" → false
	},
	formatFtype: function(sValue) {
		if (sValue === "I") {
			return "Input";
		} else if (sValue === "R") {
			return "Output";
		}
		//	return sValue || ""; // fallback if null/other
	},
	fnShowValueHelp: function(sFnmId) {
		if (!sFnmId) {
			return false;
		}

		var oFilteredModel = sap.ui.getCore().getModel("JM_FILTEREDRULE");
		if (!oFilteredModel) {
			return false;
		}

		var aResults = oFilteredModel.getProperty("/results") || [];
		var oTargetField = aResults.find(function(item) {
			return item.FnmId === sFnmId;
		});

		return !!(oTargetField && oTargetField.SearchHelp);
	},
	formatValueHelpItem: function(Ddtext, DomvalueL, Value1, Value2) {
		var val1 = DomvalueL || Value1;
		var val2 = Ddtext || Value2;
		return val1 && val2 ? val1 + " - " + val2 : (val1 || val2);
	},

	getDynamicSpan: function(p1, p2, p3, p4) {
		var aFields = [p1, p2, p3, p4];

		var iVisible = aFields.filter(function(v) {
			return !!v;
		}).length;

		if (iVisible === 0) {
			iVisible = 1;
		}

		var iSpan = Math.floor(12 / iVisible);

		if (iSpan < 2) iSpan = 2;
		if (iSpan > 12) iSpan = 12;

		return "L" + iSpan + " M" + Math.min(iSpan, 6) + " S12";
	},
	
	formatEmailSLA: function(emailSla, p1, p2, p3, p4) {
		emailSla = emailSla || "";
		p1 = p1 || "";
		p2 = p2 || "";
		p3 = p3 || "";
		p4 = p4 || "";
		return [emailSla, p1, p2, p3, p4]
			.filter(function(v) {
				return v;
			})
			.join(" - ");
	}

};