function setName(executionContext) {
    const Form = executionContext.getFormContext();

    const productLookupValue = Form.getAttribute("cr62c_product").getValue();

    if (productLookupValue != null && productLookupValue.length > 0) {
        const productName = productLookupValue[0].name;

        Form.getAttribute("cr62c_slot_name").setValue(productName);
    } else {
        Form.getAttribute("cr62c_slot_name").setValue(null);
    }
}

function calculateTotalAmount(executionContext) {
    const Form = executionContext.getFormContext();

    const quantity = Form.getAttribute("cr62c_dec_quantity").getValue();
    const pricePerUnit = Form.getAttribute("cr62c_mon_price_per_unit").getValue();

    if (quantity != null && pricePerUnit != null) {
        const totalAmount = quantity * pricePerUnit;

        Form.getAttribute("cr62c_mon_total_amount").setValue(totalAmount);
    } else {
        Form.getAttribute("cr62c_mon_total_amount").setValue(null);
    }
}

function toggleFieldsBasedOnFormType(executionContext) {
    const Form = executionContext.getFormContext();

    const formType = Form.ui.getFormType();

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
    const Form = executionContext.getFormContext();
    const priceListLookup = Form.getAttribute("cr62c_fk_price_list").getValue();

    if (priceListLookup == null) {
        Form.getControl("TransactionCurrencyId").setDisabled(true);
        return;
    }

    const priceListId = priceListLookup[0].id;

    try {
        const priceListRecord = await Xrm.WebApi.retrieveMultipleRecords("cr62c_price_list",
            `?$select=TransactionCurrencyId&$filter=cr62c_fk_price_list eq ${priceListId}&$expand=TransactionCurrencyId($select=TransactionCurrencyId)`);

        if (priceListRecord.entities.length > 0) {
            const currencyId = priceListRecord.entities[0].transactioncurrencyid.transactioncurrencyid;

            Form.getAttribute("TransactionCurrencyId").setValue([{id: currencyId, entityType: "transactioncurrency"}]);
            Form.getControl("TransactionCurrencyId").setDisabled(true);
        }
    } catch (error) {
        console.error("Error retrieving currency from Price List: ", error);
        Xrm.Navigation.openAlertDialog({text: "An error occurred while retrieving currency from Price List."});
    }
}


async function autofillCurrencyFromPriceList(executionContext) {
    const Form = executionContext.getFormContext();
    const priceList = Form.getAttribute("cr62c_fk_price_list").getValue();

    if (priceList) {
        const priceListId = priceList[0].id;

        try {
            const priceListRecord = await Xrm.WebApi.retrieveRecord("cr62c_price_list", priceListId, "?$select=TransactionCurrencyId");

            if (priceListRecord.transactioncurrencyid) {
                const currencyId = priceListRecord.transactioncurrencyid.transactioncurrencyid;
                const currencyName = priceListRecord.transactioncurrencyid.name;

                Form.getAttribute("TransactionCurrencyId").setValue([{
                    id: currencyId,
                    name: currencyName,
                    entityType: "transactioncurrency"
                }]);

                Form.getControl("TransactionCurrencyId").setDisabled(true);
            }
        } catch (error) {
            console.error("Error retrieving currency from Price List:", error);
        }
    }
}

function autofillAndHideFields(executionContext) {
    const Form = executionContext.getFormContext();
    const product = Form.getAttribute("cr62c_product").getValue();

    if (product != null) {
        const productName = product[0].name;
        Form.getAttribute("cr62c_slot_name").setValue(productName);
    }

    Form.getControl("cr62c_slot_name").setVisible(false);
    Form.getControl("OwnerId").setVisible(false);
}

async function setPricePerUnit(executionContext) {
    const Form = executionContext.getFormContext();
    const productLookup = Form.getAttribute("cr62c_Product")?.getValue();
    const priceListLookup = Form.getAttribute("cr62c_fk_price_list")?.getValue();

    if (productLookup == null || priceListLookup == null) {
        return;
    }

    const productId = productLookup[0].id;
    const priceListId = priceListLookup[0].id;

    try {
        const priceListItemRecords = await Xrm.WebApi.retrieveMultipleRecords("cr62c_price_list_items",
            `?$filter=_pricelistid_value eq ${priceListId} and _productid_value eq ${productId}`);

        let pricePerUnit = null;

        if (priceListItemRecords.entities.length > 0) {
            pricePerUnit = priceListItemRecords.entities[0].priceperunit;
        } else {
            const productRecord = await Xrm.WebApi.retrieveRecord("product", productId, "?$select=defaultpriceperunit");
            pricePerUnit = productRecord.defaultpriceperunit;
        }

        if (pricePerUnit !== null) {
            Form.getAttribute("mon_price_per_unit").setValue(pricePerUnit);
            Form.getControl("mon_price_per_unit").setDisabled(true);
        }

    } catch (error) {
        console.error("Error retrieving Price Per Unit: ", error);
        Xrm.Navigation.openAlertDialog({text: "An error occurred while retrieving Price Per Unit."});
    }
}


async function autofillPricePerUnit(executionContext) {
    const Form = executionContext.getFormContext();
    const priceList = Form.getAttribute("cr62c_fk_price_list").getValue();
    const product = Form.getAttribute("cr62c_fk_product").getValue();

    if (priceList && product) {
        const priceListId = priceList[0].id;
        const productId = product[0].id;

        try {
            const query = `?$filter=_cr62c_fk_product_value eq ${productId} and _cr62c_fk_price_list_value eq ${priceListId} &$select=mon_price_per_unit`;
            const priceListItemRecords = await Xrm.WebApi.retrieveMultipleRecords("cr62c_price_list_items", query);

            if (priceListItemRecords.entities.length > 0) {
                const pricePerUnit = priceListItemRecords.entities[0].priceperunit;
                Form.getAttribute("cr62c_mon_price_per_unit").setValue(pricePerUnit);
            } else {
                const productRecord = await Xrm.WebApi.retrieveRecord("product", productId, "?$select=mon_price_per_unit");
                Form.getAttribute("cr62c_mon_price_per_unit").setValue(productRecord.defaultpriceperunit);
            }

            Form.getControl("cr62c_mon_price_per_unit").setDisabled(true);
        } catch (error) {
            console.error("Error retrieving Price Per Unit:", error);
        }
    }
}

async function calculateChildQuantity(executionContext) {
    const Form = executionContext.getFormContext();

    const inventoryId = Form.getAttribute("cr62c_fk_inventory").getValue();
    if (!inventoryId) {
        console.error("Inventory ID is null, calculation cannot proceed.");
        return;
    }

    const fetchXml = `
    <fetch version="1.0" mapping="logical" distinct="true">
        <entity name="cr62c_inventory_product">
            <attribute name="cr62c_name"/>
            <attribute name="statecode"/>
            <attribute name="cr62c_inventory_productid"/>
            <attribute name="cr62c_product"/>
            <attribute name="cr62c_dec_quantity"/>
            <attribute name="cr62c_mon_price_per_unit"/>
            <attribute name="cr62c_mon_total_amount"/>
            <attribute name="cr62c_fk_inventory"/>
            <filter type="and">
                <condition attribute="cr62c_fk_inventory" operator="eq" value="${inventoryId[0].id}" />
            </filter>
        </entity>
    </fetch>`;

    try {
        const results = await Xrm.WebApi.retrieveMultipleRecords("cr62c_inventory_product", `?fetchXml=${encodeURIComponent(fetchXml)}`);

        let totalQuantity = 0;

        if (results.entities.length > 0) {
            results.entities.forEach(record => {
                totalQuantity += record.cr62c_dec_quantity;
            });
        }

        Form.getAttribute("total_quantity_field").setValue(totalQuantity);
    } catch (error) {
        console.error("Error executing FetchXML query: ", error);
    }
}
