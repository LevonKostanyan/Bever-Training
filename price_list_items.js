async function autofillCurrencyFromPriceList(executionContext) {
    let Form = executionContext.getFormContext();
    let priceList = Form.getAttribute("cr62c_fk_price_list").getValue();

    if (priceList) {
        let priceListId = priceList[0].id;

        try {
            let priceListRecord = await Xrm.WebApi.retrieveRecord("cr62c_fk_price_list", priceListId, "?$select=transactioncurrencyid");

            if (priceListRecord.transactioncurrencyid) {
                let currencyId = priceListRecord.transactioncurrencyid.transactioncurrencyid;
                let currencyName = priceListRecord.transactioncurrencyid.name;

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

function autofillNameFromProduct(executionContext) {
    let Form = executionContext.getFormContext();

    let productLookupValue = Form.getAttribute("cr62c_fk_product").getValue();

    if (productLookupValue != null && productLookupValue.length > 0) {
        let productName = productLookupValue[0].name;

        Form.getAttribute("cr62c_name").setValue(productName);
    } else {
        Form.getAttribute("cr62c_name").setValue(null);
    }
}