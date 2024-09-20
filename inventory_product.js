function setName(executionContext) {
    let formContext = executionContext.getFormContext();

    let productLookupValue = formContext.getAttribute("cr62c_product").getValue();

    if (productLookupValue != null && productLookupValue.length > 0) {
        let productName = productLookupValue[0].name;
        formContext.getAttribute("cr62c_name").setValue(productName);
    } else {
        formContext.getAttribute("cr62c_name").setValue(null);
    }
}

function calculateTotalAmount(executionContext) {
    let formContext = executionContext.getFormContext();
    let quantityField = formContext.getAttribute("cr62c_dec_quantity");
    let pricePerUnitField = formContext.getAttribute("cr62c_mon_price_per_unit");

    formContext.getControl("cr62c_mon_total_amount").setDisabled(true);

    if (quantityField != null && pricePerUnitField != null) {
        let quantity = quantityField.getValue();
        let pricePerUnit = pricePerUnitField.getValue();

        if (quantity != null && pricePerUnit != null) {
            let totalAmount = quantity * pricePerUnit;
            formContext.getAttribute("cr62c_mon_total_amount").setValue(totalAmount);
        } else {
            formContext.getAttribute("cr62c_mon_total_amount").setValue(null);
        }
    } else {
        console.error("Quantity or Price Per Unit fields are missing.");
        Xrm.Navigation.openAlertDialog({text: "Unable to calculate Total Amount. Please ensure Quantity and Price Per Unit fields exist."});
    }
}

function toggleFieldsBasedOnFormType(executionContext) {
    let formContext = executionContext.getFormContext();
    let formType = formContext.ui.getFormType();

    if (formType === 1) {
        enableAllFields(formContext);
    } else if (formType === 2) {
        disableAllFields(formContext);
    }
}

function disableAllFields(formContext) {
    formContext.ui.controls.forEach(function (control) {
        if (control.getControlType() !== 'subgrid') {
            control.setDisabled(true);
        }
    });
}

function enableAllFields(formContext) {
    formContext.ui.controls.forEach(function (control) {
        if (control.getControlType() !== 'subgrid') {
            control.setDisabled(false);
        }
    });
}

async function setCurrencyFromPriceList(executionContext) {
    let formContext = executionContext.getFormContext();
    let priceListLookup = formContext.getAttribute("cr62c_fk_price_list").getValue();

    if (priceListLookup == null) {
        formContext.getControl("transactioncurrencyid").setDisabled(true);
        return;
    }

    let priceListId = priceListLookup[0].id;

    let priceListRecord = await Xrm.WebApi.retrieveMultipleRecords(
        "cr62c_fk_price_list",
        `?$select=transactioncurrencyid&$filter=cr62c_fk_price_list eq ${priceListId}&$expand=transactioncurrencyid($select=transactioncurrencyid)`
    );

    if (priceListRecord.entities.length > 0) {
        let currencyId = priceListRecord.entities[0].transactioncurrencyid.transactioncurrencyid;
        formContext.getAttribute("transactioncurrencyid").setValue([{
            id: currencyId,
            entityType: "transactioncurrency"
        }]);
        formContext.getControl("transactioncurrencyid").setDisabled(true);
    }
}

async function setPricePerUnitBasedOnPriceList(executionContext) {
    let formContext = executionContext.getFormContext();

    let priceList = formContext.getAttribute("cr62c_fk_price_list").getValue();
    let product = formContext.getAttribute("cr62c_product").getValue();

    formContext.getControl("cr62c_mon_price_per_unit").setDisabled(true);

    if (priceList && product) {
        let priceListId = priceList[0].id;
        let productId = product[0].id;

        let query = `?$filter=_cr62c_product_value eq ${productId} and _cr62c_fk_price_list_value eq ${priceListId} &$select=cr62c_mon_price_per_unit`;
        let priceListItemRecords = await Xrm.WebApi.retrieveMultipleRecords("cr62c_price_list_items", query);

        if (priceListItemRecords.entities.length > 0) {
            let pricePerUnit = priceListItemRecords.entities[0].cr62c_mon_price_per_unit;
            formContext.getAttribute("cr62c_mon_price_per_unit").setValue(pricePerUnit);
        } else {
            let productRecord = await Xrm.WebApi.retrieveRecord("product", productId, "?$select=cr62c_mon_price_per_unit");
            let defaultPricePerUnit = productRecord.cr62c_mon_price_per_unit;
            formContext.getAttribute("cr62c_mon_price_per_unit").setValue(defaultPricePerUnit);
        }
    } else if (product) {
        let productId = product[0].id;
        let productRecord = await Xrm.WebApi.retrieveRecord("product", productId, "?$select=cr62c_mon_price_per_unit");
        let defaultPricePerUnit = productRecord.cr62c_mon_price_per_unit;
        formContext.getAttribute("cr62c_mon_price_per_unit").setValue(defaultPricePerUnit);
    } else {
        formContext.getAttribute("cr62c_mon_price_per_unit").setValue(null);
    }
}

async function checkProductAssociation(executionContext) {
    let formContext = executionContext.getFormContext();
    let productField = formContext.getAttribute("cr62c_product").getValue();

    if (productField != null) {
        let productId = productField[0].id;

        let fetchXml = `
        <fetch top="1">
            <entity name="cr62c_inventory_product">
                <attribute name="cr62c_product"/>
                <filter>
                    <condition attribute="cr62c_product" operator="eq" value="${productId}" />
                </filter>
            </entity>
        </fetch>`;

        fetchXml = "?fetchXml=" + encodeURIComponent(fetchXml);

        let results = await Xrm.WebApi.retrieveMultipleRecords("cr62c_inventory_product", fetchXml);

        if (results.entities.length > 0) {
            formContext.getControl("cr62c_product").setNotification("Product is already added to the inventory.", "product_exists");
        } else {
            formContext.getControl("cr62c_product").clearNotification("product_exists");
        }
    }
}
