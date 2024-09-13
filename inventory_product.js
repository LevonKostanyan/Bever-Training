function setName(executionContext) {
    let Form = executionContext.getFormContext();

    let productLookupValue = Form.getAttribute("cr62c_product").getValue();

    if (productLookupValue != null && productLookupValue.length > 0) {
        let productName = productLookupValue[0].name;

        Form.getAttribute("cr62c_name").setValue(productName);
    } else {
        Form.getAttribute("cr62c_name").setValue(null);
    }
}

function calculateTotalAmount(executionContext) {
    const Form = executionContext.getFormContext();

    const quantityField = Form.getAttribute("cr62c_dec_quantity");
    const pricePerUnitField = Form.getAttribute("cr62c_mon_price_per_unit");

    if (quantityField != null && pricePerUnitField != null) {
        const quantity = quantityField.getValue();
        const pricePerUnit = pricePerUnitField.getValue();

        if (quantity != null && pricePerUnit != null) {
            const totalAmount = quantity * pricePerUnit;
            Form.getAttribute("cr62c_mon_total_amount").setValue(totalAmount);
        } else {
            Form.getAttribute("cr62c_mon_total_amount").setValue(null);
        }
    } else {
        console.error("Quantity or Price Per Unit fields are missing.");
        Xrm.Navigation.openAlertDialog({text: "Unable to calculate Total Amount. Please ensure Quantity and Price Per Unit fields exist."});
    }
}

function toggleFieldsBasedOnFormType(executionContext) {
    let Form = executionContext.getFormContext();

    let formType = Form.ui.getFormType();

    if (formType === 1) {
        enableAllFields(Form);
    } else if (formType === 2) {
        disableAllFields(Form);
    }
}

function disableAllFields(executionContext) {
    executionContext.ui.controls.forEach(function (control) {
        if (control.getControlType() !== 'subgrid') {
            control.setDisabled(true);
        }
    });
}

function enableAllFields(executionContext) {
    executionContext.ui.controls.forEach(function (control) {
        if (control.getControlType() !== 'subgrid') {
            control.setDisabled(false);
        }
    });
}

async function setCurrencyFromPriceList(executionContext) {
    let Form = executionContext.getFormContext();
    let priceListLookup = Form.getAttribute("cr62c_fk_price_list").getValue();

    if (priceListLookup == null) {
        Form.getControl("transactioncurrencyid").setDisabled(true);
        return;
    }

    let priceListId = priceListLookup[0].id;

    try {
        let priceListRecord = await Xrm.WebApi.retrieveMultipleRecords("cr62c_fk_price_list",
            `?$select=transactioncurrencyid&$filter=cr62c_fk_price_list eq ${priceListId}&$expand=transactioncurrencyid($select=transactioncurrencyid)`);

        if (priceListRecord.entities.length > 0) {
            let currencyId = priceListRecord.entities[0].transactioncurrencyid.transactioncurrencyid;

            Form.getAttribute("transactioncurrencyid").setValue([{id: currencyId, entityType: "transactioncurrency"}]);
            Form.getControl("transactioncurrencyid").setDisabled(true);
        }
    } catch (error) {
        console.error("Error retrieving currency from Price List: ", error);
        Xrm.Navigation.openAlertDialog({text: "An error occurred while retrieving currency from Price List."});
    }
}
async function setPricePerUnitBasedOnPriceList(executionContext) {
    let Form = executionContext.getFormContext();

    let priceList = Form.getAttribute("cr62c_fk_price_list").getValue();
    let product = Form.getAttribute("cr62c_product").getValue();

    Form.getControl("cr62c_mon_price_per_unit").setDisabled(true);

    if (priceList && product) {
        let priceListId = priceList[0].id;
        let productId = product[0].id;

        try {
            let query = `?$filter=_cr62c_product_value eq ${productId} and _cr62c_fk_price_list_value eq ${priceListId} &$select=cr62c_mon_price_per_unit`;
            let priceListItemRecords = await Xrm.WebApi.retrieveMultipleRecords("cr62c_price_list_item", query);
            if (priceListItemRecords.entities.length > 0) {
                let pricePerUnit = priceListItemRecords.entities[0].cr62c_mon_price_per_unit;
                Form.getAttribute("cr62c_mon_price_per_unit").setValue(pricePerUnit);
            } else {
                let productRecord = await Xrm.WebApi.retrieveRecord("cr62c_product", productId, "?$select=cr62c_mon_price_per_unit");
                let defaultPricePerUnit = productRecord.cr62c_mon_price_per_unit;

                Form.getAttribute("cr62c_mon_price_per_unit").setValue(defaultPricePerUnit);
            }
        } catch (error) {
            console.error("Error retrieving Price Per Unit from Price List:", error);
            Xrm.Navigation.openAlertDialog({ text: "An error occurred while retrieving Price Per Unit." });
        }
    } else if (product) {
        try {
            let productId = product[0].id;
            let productRecord = await Xrm.WebApi.retrieveRecord("cr62c_product", productId, "?$select=cr62c_mon_price_per_unit");

            let defaultPricePerUnit = productRecord.cr62c_mon_price_per_unit;
            Form.getAttribute("cr62c_mon_price_per_unit").setValue(defaultPricePerUnit);

        } catch (error) {
            console.error("Error retrieving default price from Product:", error);
        }
    } else {
        Form.getAttribute("cr62c_mon_price_per_unit").setValue(null);
    }
}
