
async function getBestOffer(offers, productPrice) {   
    
    if (!offers || offers.length === 0) return null;

    const validOffers = offers.filter(offer => offer.isActive )

    if (validOffers.length === 0) return null; 
    
    const effectiveOffers = validOffers.map(offer => {
        
        let effectiveDiscount = 0;
        if (offer.offerType === 'percentage') {
            effectiveDiscount = (offer.value / 100) * productPrice;
            if (offer.maxDiscount) {
                effectiveDiscount = Math.min(effectiveDiscount, offer.maxDiscount);
            }
        } else if (offer.offerType === 'flat') {
            effectiveDiscount = offer.value;
        }

        return {
            offer,
            effectiveDiscount
        };
    });

    const bestOffer = effectiveOffers.reduce((best, current) => {
        return (best.effectiveDiscount > current.effectiveDiscount) ? best : current;
    });

    return bestOffer ? bestOffer.offer : null;
}

module.exports = {
    getBestOffer
}