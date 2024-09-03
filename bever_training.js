function setName(executionContext) {
    let Form = executionContext.getFormContext();

    let productLookupValue = Form.getAttribute("cr62c_product").getValue();

    if (productLookupValue != null && productLookupValue.length > 0) {
        let productName = productLookupValue[0].name;

        Form.getAttribute("cr62c_slot_name").setValue(productName);
    } else {
        Form.getAttribute("cr62c_slot_name").setValue(null);
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

async function autofillCurrencyFromPriceList(executionContext) {
    let Form = executionContext.getFormContext();
    let priceList = Form.getAttribute("cr62c_fk_price_list").getValue();

    if (priceList) {
        let priceListId = priceList[0].id;

        try {
            let priceListRecord = await Xrm.WebApi.retrieveRecord("cr62c_price_list", priceListId, "?$select=TransactionCurrencyId");

            if (priceListRecord.transactioncurrencyid) {
                let currencyId = priceListRecord.transactioncurrencyid.transactioncurrencyid;
                let currencyName = priceListRecord.transactioncurrencyid.name;

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

async function setCurrencyFromPriceList(executionContext) {
    let Form = executionContext.getFormContext();
    let priceListLookup = Form.getAttribute("cr62c_fk_price_list").getValue();

    if (priceListLookup == null) {
        Form.getControl("TransactionCurrencyId").setDisabled(true);
        return;
    }

    let priceListId = priceListLookup[0].id;

    try {
        let priceListRecord = await Xrm.WebApi.retrieveMultipleRecords("cr62c_price_list",
            `?$select=TransactionCurrencyId&$filter=cr62c_fk_price_list eq ${priceListId}&$expand=TransactionCurrencyId($select=TransactionCurrencyId)`);

        if (priceListRecord.entities.length > 0) {
            let currencyId = priceListRecord.entities[0].transactioncurrencyid.transactioncurrencyid;

            Form.getAttribute("TransactionCurrencyId").setValue([{id: currencyId, entityType: "transactioncurrency"}]);
            Form.getControl("TransactionCurrencyId").setDisabled(true);
        }
    } catch (error) {
        console.error("Error retrieving currency from Price List: ", error);
        Xrm.Navigation.openAlertDialog({text: "An error occurred while retrieving currency from Price List."});
    }
}

async function CalculateTotalPriceInInventory(formContext) {
    let recordId = formContext.data.entity.getId();

    let fetchXml = `
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
                <condition attribute="cr62c_fk_inventory" operator="eq" value="${recordId}" />
            </filter>
        </entity>
    </fetch>`;

    fetchXml = "?fetchXml=" + encodeURIComponent(fetchXml);

    try {
        let inventoryLinesArray = await Xrm.WebApi.retrieveMultipleRecords('cr62c_inventory_product', fetchXml);
        let inventoryLinesQuantity = inventoryLinesArray.entities.length;

        let priceList = formContext.getAttribute("cr62c_fk_price_list").getValue();
        if (priceList === null) {
            console.error("Price List is null.");
            return;
        }
        let priceListId = priceList[0].id.toLowerCase();

        let totalPrice = 0;

        for (let i = 0; i < inventoryLinesQuantity; i++) {
            let line = inventoryLinesArray.entities[i];

            let linePriceListId = line["priceListItem.cr62c_fk_price_list"]?.toLowerCase();
            if (linePriceListId === priceListId) {
                let quantity = line["cr62c_dec_quantity"];
                let price = line["priceListItem.cr62c_mon_price"];

                if (quantity && price) {
                    totalPrice += price * quantity;
                }
            }
        }

        formContext.getAttribute("cr62c_mon_total_amount").setValue(totalPrice);

    } catch (error) {
        console.error("Error calculating total price: ", error);
    }
}

function autofillAndHideFields(executionContext) {
    let Form = executionContext.getFormContext();
    let product = Form.getAttribute("cr62c_product").getValue();

    if (product != null) {
        let productName = product[0].name;
        Form.getAttribute("cr62c_slot_name").setValue(productName);
    }

    Form.getControl("cr62c_slot_name").setVisible(false);
    Form.getControl("OwnerId").setVisible(false);
}


//----------------------------- unused functions ----------------------------------
//------------------------------------ || -----------------------------------------
//------------------------------------ \/ -----------------------------------------


async function setPricePerUnit(executionContext) {
    let Form = executionContext.getFormContext();
    let productLookup = Form.getAttribute("cr62c_Product")?.getValue();
    let priceListLookup = Form.getAttribute("cr62c_fk_price_list")?.getValue();

    if (productLookup == null || priceListLookup == null) {
        return;
    }

    let productId = productLookup[0].id;
    let priceListId = priceListLookup[0].id;

    try {
        let priceListItemRecords = await Xrm.WebApi.retrieveMultipleRecords("cr62c_price_list_items",
            `?$filter=_pricelistid_value eq ${priceListId} and _productid_value eq ${productId}`);

        let pricePerUnit = null;

        if (priceListItemRecords.entities.length > 0) {
            pricePerUnit = priceListItemRecords.entities[0].priceperunit;
        } else {
            let productRecord = await Xrm.WebApi.retrieveRecord("product", productId, "?$select=defaultpriceperunit");
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
    let Form = executionContext.getFormContext();
    let priceList = Form.getAttribute("cr62c_fk_price_list").getValue();
    let product = Form.getAttribute("cr62c_fk_product").getValue();

    if (priceList && product) {
        let priceListId = priceList[0].id;
        let productId = product[0].id;

        try {
            let query = `?$filter=_cr62c_fk_product_value eq ${productId} and _cr62c_fk_price_list_value eq ${priceListId} &$select=mon_price_per_unit`;
            let priceListItemRecords = await Xrm.WebApi.retrieveMultipleRecords("cr62c_price_list_items", query);

            if (priceListItemRecords.entities.length > 0) {
                let pricePerUnit = priceListItemRecords.entities[0].priceperunit;
                Form.getAttribute("cr62c_mon_price_per_unit").setValue(pricePerUnit);
            } else {
                let productRecord = await Xrm.WebApi.retrieveRecord("product", productId, "?$select=mon_price_per_unit");
                Form.getAttribute("cr62c_mon_price_per_unit").setValue(productRecord.defaultpriceperunit);
            }

            Form.getControl("cr62c_mon_price_per_unit").setDisabled(true);
        } catch (error) {
            console.error("Error retrieving Price Per Unit:", error);
        }
    }
}

async function calculateChildQuantity(executionContext) {
    let Form = executionContext.getFormContext();

    let inventoryId = Form.getAttribute("cr62c_fk_inventory").getValue();
    if (!inventoryId) {
        console.error("Inventory ID is null, calculation cannot proceed.");
        return;
    }

    let fetchXml = `
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
        let results = await Xrm.WebApi.retrieveMultipleRecords("cr62c_inventory_product", `?fetchXml=${encodeURIComponent(fetchXml)}`);

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






async function initializePriceList(formContext) {
    let priceListLookup = formContext.getAttribute("cr62c_fk_price_list").getValue();

    if (!priceListLookup) {
        Xrm.Navigation.openAlertDialog({ text: "Please select a Price List." });
        return;
    }

    let priceListId = priceListLookup[0].id;

    try {
        await deletePriceListItems(priceListId);

        await createPriceListItems(priceListId);

        Xrm.Navigation.openAlertDialog({ text: "Price List has been initialized successfully." });

    } catch (error) {
        console.error("Error initializing Price List:", error);
        Xrm.Navigation.openAlertDialog({ text: "An error occurred while initializing the Price List." });
    }
}

async function deletePriceListItems(priceListId) {
    let fetchXml = `
    <fetch>
        <entity name="pricelistitem">
            <attribute name="pricelistitemid"/>
            <filter>
                <condition attribute="cr62c_fk_price_list" operator="eq" value="${priceListId}" />
            </filter>
        </entity>
    </fetch>`;

    let priceListItems = await Xrm.WebApi.retrieveMultipleRecords("pricelistitem", `?fetchXml=${encodeURIComponent(fetchXml)}`);

    for (let item of priceListItems.entities) {
        await Xrm.WebApi.deleteRecord("pricelistitem", item.pricelistitemid);
    }
}

async function createPriceListItems(priceListId) {
    let priceList = await Xrm.WebApi.retrieveRecord("pricelevel", priceListId, "?$select=transactioncurrencyid");
    let currencyId = priceList.transactioncurrencyid;

    let products = await Xrm.WebApi.retrieveMultipleRecords("product", "?$select=productid,name");

    for (let product of products.entities) {
        let priceListItem = {
            "cr62c_fk_product@odata.bind": `/products(${product.productid})`,
            "cr62c_fk_price_list@odata.bind": `/pricelevels(${priceListId})`,
            "transactioncurrencyid@odata.bind": `/transactioncurrencies(${currencyId.transactioncurrencyid})`,
            "priceperunit": 1,
            "name": product.name
        };

        await Xrm.WebApi.createRecord("pricelistitem", priceListItem);
    }
}
