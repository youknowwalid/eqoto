-- Synthetic demonstration data. Every company, ticker, investor and article below is invented.
-- Idempotent (on conflict do nothing) so it never overwrites existing records.

insert into public.instruments (symbol, name, kind, sector, exchange, price, prev_close, volatility) values
 ('NOVA','Novara Systems Corp','stock','Technology','EQOTO Sim',218.42,215.88,0.0018),
 ('ARCA','Arcadia Commerce Inc','stock','Consumer','EQOTO Sim',164.90,165.76,0.0018),
 ('MRDN','Meridian Software','stock','Technology','EQOTO Sim',487.35,485.70,0.0020),
 ('KRYO','Kryo Biotherapeutics','stock','Healthcare','EQOTO Sim',73.12,72.40,0.0030),
 ('TRVO','Travo Mobility','stock','Industrials','EQOTO Sim',41.58,41.95,0.0024),
 ('SOLR','Solara Energy','stock','Energy','EQOTO Sim',29.84,29.41,0.0028),
 ('HRBR','Harbor Financial Group','stock','Financials','EQOTO Sim',96.27,96.02,0.0014),
 ('WRLD','World Index ETF','etf','Diversified','EQOTO Sim',112.76,112.30,0.0008),
 ('TCHX','Tech Leaders ETF','etf','Technology','EQOTO Sim',241.30,237.45,0.0012),
 ('GRNX','Clean Energy ETF','etf','Energy','EQOTO Sim',58.14,58.65,0.0014),
 ('LUMN','Lumen Coin','crypto','Digital assets','EQOTO Sim',2843.10,2767.20,0.0055),
 ('ORBT','Orbit Token','crypto','Digital assets','EQOTO Sim',96.28,97.60,0.0060),
 ('HELX','Helix Network','crypto','Digital assets','EQOTO Sim',14.07,13.94,0.0065)
on conflict (symbol) do nothing;
update public.instruments set featured = true where symbol in ('NOVA','MRDN','WRLD','LUMN') and not exists (select 1 from public.instruments where featured);

insert into public.investors (kind, name, handle, look, country, bio, risk, return_24m, followers, copiers, verified, featured, volatility) values
 ('investor','Maren Halvorsen','maren_h',0,'Norway','Investment director with 9+ years of experience. Quality growth, low turnover.',4,35.38,495,0,true,true,0.0012),
 ('investor','Daniel Okafor','dokafor',1,'Nigeria','Long-term wealth builder: broad ETFs plus a few concentrated conviction picks.',5,54.46,1518,0,true,true,0.0018),
 ('investor','Theo Lindgren','theo_l',2,'Sweden','Spreads risk across sectors, regions and a small slice of crypto.',6,41.20,832,0,true,false,0.0016),
 ('investor','Priya Raman','priya_r',3,'India','Dividend-focused with a technology tilt. Rebalances quarterly.',3,22.75,611,0,true,false,0.0009),
 ('investor','Lucía Ferrer','lucia_f',4,'Spain','Macro-driven swing trader. Higher risk, shorter holding periods.',8,78.90,2204,0,true,true,0.0030),
 ('investor','Hiro Tanabe','hiro_t',5,'Japan','Systematic momentum across ETFs and large caps.',5,29.40,377,0,false,false,0.0014),
 ('agent','Atlas Balanced','atlas_balanced',6,'','AI portfolio rebalancing monthly between a global ETF and short-duration assets. Simulated.',3,14.20,0,0,false,false,0.0007),
 ('agent','Vector Growth','vector_growth',7,'','AI portfolio tilted to technology and clean energy. Simulated.',7,48.10,0,0,false,false,0.0022),
 ('agent','Ember Crypto','ember_crypto',8,'','AI portfolio rotating across digital assets. High volatility. Simulated.',9,96.30,0,0,false,false,0.0040)
on conflict (handle) do nothing;

insert into public.articles (title, category, summary, body, minutes) select * from (values
 ('What is a stock, really?','Basics','Ownership, shares and why prices move.',E'A stock is a small slice of ownership in a company.\n\nWhen more people want to buy than sell, the price tends to rise; when more want to sell, it tends to fall.\n\nOn EQOTO, every stock shown is a fictional company used for practice.',4),
 ('Diversification in five minutes','Basics','Why spreading risk usually beats picking one winner.',E'Diversification means not putting all your money in one place.\n\nAn ETF holds many assets in a single instrument, which is a simple way to spread risk.\n\nDiversification reduces risk but never removes it.',5),
 ('Reading a price chart','Analysis','Timeframes, trends and what a chart cannot tell you.',E'A chart shows how a price moved, not where it will go next.\n\nShort timeframes look noisy; longer timeframes show the broader trend.\n\nPrices in the EQOTO demo are simulated.',6),
 ('Risk, return and your comfort zone','Risk','How to size a position you can sleep with.',E'Higher potential return normally means higher risk.\n\nDecide in advance how much of a fall you could accept before investing.\n\nOnly invest money you can afford to lose.',5),
 ('How mirroring works in the demo','Platform','What happens to your simulated allocation.',E'When you mirror an investor on EQOTO, you allocate part of your simulated balance to that investor''s performance index.\n\nThe value moves with the index until you stop mirroring, at which point the current value returns to your balance.\n\nThis is a demonstration: no real trades are copied.',4)
) v(title, category, summary, body, minutes) where not exists (select 1 from public.articles);

insert into public.events (title, region, impact, category, starts_at, forecast, previous) select * from (values
 ('Consumer price index (YoY)','US','high','economic', date_trunc('day', now()) + interval '2 days 13 hours','3.1%','3.2%'),
 ('Central bank rate decision','EU','high','economic', date_trunc('day', now()) + interval '4 days 12 hours','2.50%','2.75%'),
 ('Retail sales (MoM)','UK','medium','economic', date_trunc('day', now()) + interval '5 days 7 hours','0.3%','0.1%'),
 ('Non-farm payrolls','US','high','economic', date_trunc('day', now()) + interval '7 days 13 hours','175K','190K'),
 ('Novara Systems — quarterly results','US','medium','earnings', date_trunc('day', now()) + interval '3 days 21 hours','EPS 1.84','EPS 1.71'),
 ('Meridian Software — quarterly results','US','medium','earnings', date_trunc('day', now()) + interval '6 days 21 hours','EPS 3.02','EPS 2.88'),
 ('Harbor Financial — quarterly results','US','low','earnings', date_trunc('day', now()) + interval '8 days 12 hours','EPS 1.12','EPS 1.05')
) v(title, region, impact, category, starts_at, forecast, previous) where not exists (select 1 from public.events);
