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

async function autofillCurrencyFromPriceList(executionContext) {
    const Form = executionContext.getFormContext();
    const priceList = Form.getAttribute("cr62c_fk_price_list").getValue();

    if (priceList) {
        const priceListId = priceList[0].id;

        try {
            const priceListRecord = await Xrm.WebApi.retrieveRecord("cr62c_price_list", priceListId, "?$select=transactioncurrencyid");

            if (priceListRecord.transactioncurrencyid) {
                const currencyId = priceListRecord.transactioncurrencyid.transactioncurrencyid;
                const currencyName = priceListRecord.transactioncurrencyid.name;

                Form.getAttribute("transactioncurrencyid").setValue([{
                    id: currencyId,
                    name: currencyName,
                    entityType: "transactioncurrency"
                }]);

                Form.getControl("transactioncurrencyid").setDisabled(true);
            }
        } catch (error) {
            console.error("Error retrieving currency from Price List:", error);
        }
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
            const query = `?$filter=_productid_value eq ${productId} and _pricelistid_value eq ${priceListId} &$select=priceperunit`;
            const priceListItemRecords = await Xrm.WebApi.retrieveMultipleRecords("pricelistitem", query);

            if (priceListItemRecords.entities.length > 0) {
                const pricePerUnit = priceListItemRecords.entities[0].priceperunit;
                Form.getAttribute("cr62c_mon_price_per_unit").setValue(pricePerUnit);
            } else {
                const productRecord = await Xrm.WebApi.retrieveRecord("product", productId, "?$select=defaultpriceperunit");
                Form.getAttribute("cr62c_mon_price_per_unit").setValue(productRecord.defaultpriceperunit);
            }

            Form.getControl("cr62c_mon_price_per_unit").setDisabled(true);
        } catch (error) {
            console.error("Error retrieving Price Per Unit:", error);
        }
    }
}