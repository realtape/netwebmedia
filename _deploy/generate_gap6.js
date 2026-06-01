/**
 * Generates 200 contacts per US state per niche for 6 niches = 60,000 contacts.
 * Appends to usa_crm_import.json.
 */
const fs = require('fs');
const path = require('path');

// ── Name pools ─────────────────────────────────────────────────────────────
const FIRST = ['James','Maria','David','Jennifer','Michael','Lisa','Robert','Sarah','William','Karen','Richard','Nancy','Charles','Margaret','Joseph','Betty','Thomas','Sandra','Christopher','Ashley','Daniel','Dorothy','Paul','Emily','Mark','Kimberly','Donald','Donna','George','Michelle','Kenneth','Carol','Steven','Amanda','Edward','Melissa','Brian','Deborah','Ronald','Stephanie','Anthony','Rebecca','Kevin','Sharon','Jason','Laura','Matthew','Cynthia','Gary','Kathleen','Timothy','Amy','Jose','Angela','Larry','Shirley','Jeffrey','Anna','Frank','Brenda','Scott','Pamela','Eric','Emma','Stephen','Nicole','Andrew','Helen','Raymond','Samantha','Gregory','Katherine','Joshua','Christine','Jerry','Debra','Dennis','Rachel','Walter','Carolyn','Patrick','Janet','Peter','Catherine','Harold','Heather','Douglas','Diane','Henry','Julie','Carl','Joyce','Ryan','Victoria','Roger','Kelly','Joe','Christina','Juan','Joan','Jack','Evelyn','Albert','Lauren','Jonathan','Judith','Justin','Olivia','Terry','Frances','Gerald','Martha','Keith','Cheryl','Samuel','Megan','Willie','Andrea','Ralph','Alice','Carlos','Gloria','Sofia','Marco','Aisha','Derrick','Priya','Mei','Andre','Elena','Sean','Fatima','Omar','Diana','Lucas','Nina','Ethan','Zoe','Logan','Chloe','Mason','Aria','Liam','Isabella','Noah','Mia','Elijah','Charlotte','Oliver','Amelia','Benjamin','Harper','Jackson','Evelyn','Aiden','Abigail','Sebastian','Emily','Muhammad','Aaliyah','Jayden','Naomi','Caleb','Savannah','Dylan','Madison','Gabriel','Brooklyn','Wyatt','Leah','Julian','Audrey','Grayson','Bella','Mateo','Claire','Santiago','Scarlett','Cameron'];
const LAST = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson','Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores','Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts','Turner','Phillips','Evans','Collins','Parker','Edwards','Stewart','Morris','Richardson','Wood','Watson','Brooks','Bennett','Gray','Reyes','Cruz','Hughes','Price','Myers','Long','Foster','Sanders','Ross','Morgan','Reed','Bailey','Bell','Gomez','Kelly','Howard','Ward','Cox','Diaz','Cooper','Peterson','Murphy','Cook','Rogers','Gutierrez','Ortiz','Webb','Kim','Chen','Patel','Okafor','Singh','Walsh','Brennan','Nakamura','Tran','Vasquez','Castillo','Morales','Romero','Jimenez','Ruiz','Alvarez','Mendoza','Ramos','Guzman','Munoz','Chávez','Herrera','Medina','Aguilar','Vega','Reyes','Castro','Vargas','Delgado','Ortega'];

// ── State data ──────────────────────────────────────────────────────────────
const STATES = [
  {name:'Alabama',code:'AL',slug:'alabama',areas:['205','251','256','334'],cities:['Birmingham','Montgomery','Mobile','Huntsville','Tuscaloosa','Hoover','Dothan','Auburn','Decatur','Gadsden']},
  {name:'Alaska',code:'AK',slug:'alaska',areas:['907'],cities:['Anchorage','Fairbanks','Juneau','Sitka','Ketchikan','Kodiak','Wasilla','Homer']},
  {name:'Arizona',code:'AZ',slug:'arizona',areas:['480','520','602','623','928'],cities:['Phoenix','Tucson','Mesa','Chandler','Scottsdale','Tempe','Gilbert','Glendale','Peoria','Surprise','Flagstaff','Yuma']},
  {name:'Arkansas',code:'AR',slug:'arkansas',areas:['479','501','870'],cities:['Little Rock','Fort Smith','Fayetteville','Springdale','Jonesboro','Conway','Rogers','Pine Bluff','Bentonville']},
  {name:'California',code:'CA',slug:'california',areas:['213','310','323','408','415','510','619','626','650','714','818','909','949'],cities:['Los Angeles','San Francisco','San Diego','San Jose','Sacramento','Oakland','Fresno','Riverside','Long Beach','Bakersfield','Anaheim','Pasadena','Inglewood','Pomona','Irvine','Santa Ana','Stockton','Chula Vista','Modesto','Fontana']},
  {name:'Colorado',code:'CO',slug:'colorado',areas:['303','719','720','970'],cities:['Denver','Colorado Springs','Aurora','Fort Collins','Lakewood','Boulder','Pueblo','Westminster','Arvada','Thornton','Highlands Ranch','Longmont']},
  {name:'Connecticut',code:'CT',slug:'connecticut',areas:['203','475','860'],cities:['Bridgeport','New Haven','Hartford','Stamford','Waterbury','Norwalk','Danbury','New Britain','Bristol','West Haven']},
  {name:'Delaware',code:'DE',slug:'delaware',areas:['302'],cities:['Wilmington','Dover','Newark','Middletown','Smyrna','Milford','Seaford','Georgetown']},
  {name:'Florida',code:'FL',slug:'florida',areas:['305','321','407','561','727','813','850','904','941','954'],cities:['Jacksonville','Miami','Tampa','Orlando','St. Petersburg','Hialeah','Tallahassee','Fort Lauderdale','Pembroke Pines','Hollywood','Gainesville','Clearwater','Boca Raton','Sarasota','Naples','Daytona Beach','Coral Springs','Cape Coral','Fort Myers','Lakeland']},
  {name:'Georgia',code:'GA',slug:'georgia',areas:['229','404','470','478','678','706','770','912'],cities:['Atlanta','Columbus','Augusta','Savannah','Athens','Sandy Springs','Macon','Roswell','Marietta','Albany','Peachtree City','Warner Robins','Johns Creek','Alpharetta','Smyrna']},
  {name:'Hawaii',code:'HI',slug:'hawaii',areas:['808'],cities:['Honolulu','Pearl City','Hilo','Kailua','Kapolei','Kaneohe','Kahului','Kihei','Waipahu']},
  {name:'Idaho',code:'ID',slug:'idaho',areas:['208'],cities:['Boise','Meridian','Nampa','Idaho Falls','Pocatello','Caldwell','Twin Falls','Lewiston','Post Falls']},
  {name:'Illinois',code:'IL',slug:'illinois',areas:['217','224','312','618','630','708','773','815','847'],cities:['Chicago','Aurora','Rockford','Joliet','Naperville','Springfield','Peoria','Elgin','Waukegan','Champaign','Decatur','Evanston','Bloomington','Schaumburg']},
  {name:'Indiana',code:'IN',slug:'indiana',areas:['219','260','317','574','765','812'],cities:['Indianapolis','Fort Wayne','Evansville','South Bend','Carmel','Fishers','Bloomington','Hammond','Lafayette','Muncie','Gary','Terre Haute']},
  {name:'Iowa',code:'IA',slug:'iowa',areas:['319','515','563','641','712'],cities:['Des Moines','Cedar Rapids','Davenport','Sioux City','Iowa City','Waterloo','Ames','Dubuque','Council Bluffs','Ankeny']},
  {name:'Kansas',code:'KS',slug:'kansas',areas:['316','620','785','913'],cities:['Wichita','Overland Park','Kansas City','Olathe','Topeka','Lawrence','Shawnee','Manhattan','Lenexa','Salina']},
  {name:'Kentucky',code:'KY',slug:'kentucky',areas:['270','502','606','859'],cities:['Louisville','Lexington','Bowling Green','Owensboro','Covington','Georgetown','Florence','Elizabethtown','Paducah','Frankfort']},
  {name:'Louisiana',code:'LA',slug:'louisiana',areas:['225','318','337','504','985'],cities:['New Orleans','Baton Rouge','Shreveport','Metairie','Lafayette','Lake Charles','Kenner','Monroe','Bossier City','Alexandria']},
  {name:'Maine',code:'ME',slug:'maine',areas:['207'],cities:['Portland','Lewiston','Bangor','South Portland','Auburn','Biddeford','Augusta','Saco','Westbrook']},
  {name:'Maryland',code:'MD',slug:'maryland',areas:['240','301','410','443'],cities:['Baltimore','Rockville','Gaithersburg','Frederick','Bowie','Hagerstown','Annapolis','College Park','Salisbury','Laurel']},
  {name:'Massachusetts',code:'MA',slug:'massachusetts',areas:['339','413','508','617','774','781','857','978'],cities:['Boston','Worcester','Springfield','Lowell','Cambridge','Quincy','New Bedford','Brockton','Lynn','Fall River','Somerville','Lawrence','Newton']},
  {name:'Michigan',code:'MI',slug:'michigan',areas:['231','248','313','517','586','616','734','810'],cities:['Detroit','Grand Rapids','Warren','Sterling Heights','Ann Arbor','Lansing','Flint','Dearborn','Livonia','Kalamazoo','Troy','Westland','Clinton Township']},
  {name:'Minnesota',code:'MN',slug:'minnesota',areas:['218','320','507','612','651','763','952'],cities:['Minneapolis','St. Paul','Rochester','Duluth','Bloomington','Brooklyn Park','Plymouth','St. Cloud','Eagan','Coon Rapids','Burnsville','Mankato']},
  {name:'Mississippi',code:'MS',slug:'mississippi',areas:['228','601','662'],cities:['Jackson','Gulfport','Southaven','Hattiesburg','Biloxi','Meridian','Tupelo','Greenville','Olive Branch','Horn Lake']},
  {name:'Missouri',code:'MO',slug:'missouri',areas:['314','417','573','636','816'],cities:['Kansas City','St. Louis','Springfield','Columbia','Independence','Lee\'s Summit','O\'Fallon','St. Joseph','Blue Springs','Joplin']},
  {name:'Montana',code:'MT',slug:'montana',areas:['406'],cities:['Billings','Missoula','Great Falls','Bozeman','Butte','Helena','Kalispell','Havre','Anaconda']},
  {name:'Nebraska',code:'NE',slug:'nebraska',areas:['308','402'],cities:['Omaha','Lincoln','Bellevue','Grand Island','Kearney','Fremont','Norfolk','Hastings','Columbus']},
  {name:'Nevada',code:'NV',slug:'nevada',areas:['702','725','775'],cities:['Las Vegas','Henderson','Reno','North Las Vegas','Sparks','Carson City','Sunrise Manor','Enterprise','Spring Valley']},
  {name:'New Hampshire',code:'NH',slug:'new-hampshire',areas:['603'],cities:['Manchester','Nashua','Concord','Derry','Dover','Rochester','Salem','Portsmouth','Keene','Merrimack']},
  {name:'New Jersey',code:'NJ',slug:'new-jersey',areas:['201','609','732','848','856','908','973'],cities:['Newark','Jersey City','Paterson','Elizabeth','Edison','Woodbridge','Toms River','Hamilton','Trenton','Clifton','Camden','Passaic']},
  {name:'New Mexico',code:'NM',slug:'new-mexico',areas:['505','575'],cities:['Albuquerque','Las Cruces','Rio Rancho','Santa Fe','Roswell','Farmington','Clovis','Hobbs','Alamogordo']},
  {name:'New York',code:'NY',slug:'new-york',areas:['212','315','347','516','518','585','631','646','716','718','845','914'],cities:['New York City','Buffalo','Rochester','Yonkers','Syracuse','Albany','White Plains','Hempstead','Brentwood','Schenectady','Utica','New Rochelle','Mount Vernon','Cheektowaga']},
  {name:'North Carolina',code:'NC',slug:'north-carolina',areas:['252','336','704','828','910','919','980'],cities:['Charlotte','Raleigh','Greensboro','Durham','Winston-Salem','Fayetteville','Cary','Wilmington','High Point','Asheville','Concord','Gastonia','Rocky Mount','Burlington']},
  {name:'North Dakota',code:'ND',slug:'north-dakota',areas:['701'],cities:['Fargo','Bismarck','Grand Forks','Minot','West Fargo','Williston','Mandan','Dickinson','Jamestown']},
  {name:'Ohio',code:'OH',slug:'ohio',areas:['216','234','330','419','513','567','614','740','937'],cities:['Columbus','Cleveland','Cincinnati','Toledo','Akron','Dayton','Parma','Canton','Youngstown','Springfield','Hamilton','Lorain','Elyria','Lakewood']},
  {name:'Oklahoma',code:'OK',slug:'oklahoma',areas:['405','539','580','918'],cities:['Oklahoma City','Tulsa','Norman','Broken Arrow','Lawton','Edmond','Moore','Midwest City','Enid','Stillwater']},
  {name:'Oregon',code:'OR',slug:'oregon',areas:['458','503','541','971'],cities:['Portland','Salem','Eugene','Gresham','Hillsboro','Beaverton','Bend','Medford','Springfield','Corvallis','Albany','Lake Oswego']},
  {name:'Pennsylvania',code:'PA',slug:'pennsylvania',areas:['215','267','412','484','570','610','717','724','814'],cities:['Philadelphia','Pittsburgh','Allentown','Erie','Reading','Scranton','Bethlehem','Lancaster','Harrisburg','York','Altoona','Wilkes-Barre']},
  {name:'Rhode Island',code:'RI',slug:'rhode-island',areas:['401'],cities:['Providence','Warwick','Cranston','Pawtucket','East Providence','Woonsocket','Newport','Bristol','North Providence']},
  {name:'South Carolina',code:'SC',slug:'south-carolina',areas:['803','843','864'],cities:['Charleston','Columbia','North Charleston','Mount Pleasant','Rock Hill','Greenville','Summerville','Sumter','Florence','Spartanburg']},
  {name:'South Dakota',code:'SD',slug:'south-dakota',areas:['605'],cities:['Sioux Falls','Rapid City','Aberdeen','Brookings','Watertown','Mitchell','Huron','Pierre','Brandon']},
  {name:'Tennessee',code:'TN',slug:'tennessee',areas:['423','615','731','865','901','931'],cities:['Memphis','Nashville','Knoxville','Chattanooga','Clarksville','Murfreesboro','Franklin','Jackson','Johnson City','Bartlett','Kingsport','Hendersonville']},
  {name:'Texas',code:'TX',slug:'texas',areas:['210','214','281','325','361','409','469','512','682','713','737','806','817','832','903','915','940','956','972','979'],cities:['Houston','San Antonio','Dallas','Austin','Fort Worth','El Paso','Arlington','Corpus Christi','Plano','Laredo','Lubbock','Garland','Irving','Frisco','McKinney','Amarillo','Brownsville','Mesquite','Killeen','Pasadena','Beaumont','McAllen','Waco','Midland','Odessa']},
  {name:'Utah',code:'UT',slug:'utah',areas:['385','435','801'],cities:['Salt Lake City','West Valley City','Provo','West Jordan','Orem','Sandy','Ogden','St. George','Layton','South Jordan','Lehi','Millcreek']},
  {name:'Vermont',code:'VT',slug:'vermont',areas:['802'],cities:['Burlington','South Burlington','Rutland','Essex','Colchester','Montpelier','Barre','Williston','Milton']},
  {name:'Virginia',code:'VA',slug:'virginia',areas:['276','434','540','571','703','757','804'],cities:['Virginia Beach','Norfolk','Chesapeake','Richmond','Newport News','Alexandria','Hampton','Roanoke','Portsmouth','Lynchburg','Harrisonburg','Charlottesville']},
  {name:'Washington',code:'WA',slug:'washington',areas:['206','253','360','425','509'],cities:['Seattle','Spokane','Tacoma','Vancouver','Bellevue','Kirkland','Renton','Bellingham','Redmond','Olympia','Kent','Everett','Marysville','Federal Way']},
  {name:'West Virginia',code:'WV',slug:'west-virginia',areas:['304'],cities:['Charleston','Huntington','Morgantown','Parkersburg','Wheeling','Weirton','Fairmont','Beckley','Clarksburg']},
  {name:'Wisconsin',code:'WI',slug:'wisconsin',areas:['262','414','608','715','920'],cities:['Milwaukee','Madison','Green Bay','Kenosha','Racine','Appleton','Waukesha','Oshkosh','Eau Claire','Janesville','West Allis','La Crosse']},
  {name:'Wyoming',code:'WY',slug:'wyoming',areas:['307'],cities:['Cheyenne','Casper','Laramie','Gillette','Rock Springs','Sheridan','Riverton','Jackson','Evanston']}
];

// ── Niche company name parts ────────────────────────────────────────────────
const NICHES = {
  automotive: {
    key: 'automotive',
    words: ['Auto','Motors','Automotive','Motor Works','Auto Works','Auto Group','Auto Center','Car Group','Service Center','Auto Repair','Auto Body','Tire & Auto','Auto Care','Auto Sales','Motor Group','Quick Lube','Detail Shop','Auto Spa','Drive Auto','Wheel Works','Auto Detailing','Vehicle Group','Garage','Collision Center','Car Wash'],
    adjectives: ['Westside','Eastside','Northside','Southside','Central','Premier','Elite','Classic','Summit','Valley','Riverside','Metro','Pacific','Atlantic','Midwest','Southern','Northern','Mountain','Desert','Coastal','Capitol','Golden','Silver','Heritage','Pioneer','American','National','Regional','Prestige','Superior','Quality','Reliable','Fast','Expert','Pro','Ace','Top','Best','Trusted','First','Main Street','Highway','Crossroads','Lakeview','Hillcrest','Pinecrest','Oakwood','Cedarwood','Maplewood','Birchwood']
  },
  education: {
    key: 'education',
    words: ['Academy','Learning Center','Tutoring','Institute','Education Center','Prep','Learning Academy','Academic Center','Tutoring Hub','Study Center','Learning Lab','Skills Institute','Training Center','Education Group','Test Prep','Coaching Academy','Learning Studio','Achievement Center','Education Institute','Scholar Hub'],
    adjectives: ['Pacific','Atlantic','Mountain','Valley','Summit','Elite','Premier','Advanced','Horizon','Bright','Success','Academic','Excellence','Future','Scholars','Gateway','Pathway','Milestone','Pinnacle','Champion','Core','Focus','Achieve','Rise','Ascend','Apex','Catalyst','Inspire','Empower','Elevate','North Star','Compass','Lighthouse','Beacon','Vanguard','Pioneer','Heritage','Lakeside','Riverside','Hillside','Meadow','Oak','Maple','Birch','Cedar','Sunrise','Horizon','National','Premier','Prestige','Landmark']
  },
  events_weddings: {
    key: 'events_weddings',
    words: ['Events','Weddings','Celebrations','Venue','Affairs','Occasions','Planning','Event Co.','Wedding Co.','Event Group','Celebrations Co.','Event Design','Wedding Design','Event Productions','Banquet Hall','Event Space','Wedding Venue','Event Studio','Catering & Events','Wedding Group'],
    adjectives: ['Vineyard','Garden','Estate','Magnolia','Rosewood','Oakwood','Elmwood','Willow','Birchwood','Cedarwood','Ivory','Pearl','Crystal','Diamond','Golden','Silver','Amber','Rose','Lily','Iris','Violet','Lavender','Sage','Jasmine','Orchid','Peony','Grand','Classic','Premier','Elite','Prestige','Signature','Luxe','Pinnacle','Summit','Horizon','Legacy','Timeless','Enchanted','Heritage','Serene','Blissful','Majestic','Royal','Regal','Noble','Graceful','Elegant','Refined','Polished','Tasteful']
  },
  financial_services: {
    key: 'financial_services',
    words: ['Financial','Wealth Partners','Advisors','Capital','Capital Partners','Wealth Management','Financial Group','Tax Group','Accounting','Insurance','Financial Planning','Wealth Advisors','Tax Advisors','Investment Partners','Financial Services','Tax & Accounting','Wealth Group','Advisory Partners','Financial Advisors','CPA Group'],
    adjectives: ['Hudson','Pacific','Atlantic','Summit','Capital','Heritage','Patriot','Liberty','Pinnacle','Apex','Meridian','Horizon','Keystone','Cornerstone','Bedrock','Granite','Marble','Oak','Maple','Cedar','Elm','Sequoia','Redwood','Cypress','Magnolia','Dogwood','Hawthorn','Chestnut','Walnut','Ironside','Northstar','Compass','Landmark','Vanguard','Sentinel','Guardian','Anchor','Beacon','Sterling','Platinum','Emerald','Sapphire','Onyx','Cobalt','Indigo','Crimson','Ivory','Obsidian','Titanium']
  },
  home_services: {
    key: 'home_services',
    words: ['Contracting','Plumbing','HVAC','Roofing','Landscaping','Home Services','Construction','Renovation','Remodeling','Painting','Electrical','Flooring','Windows & Doors','Gutters','Siding','Insulation','Waterproofing','Foundation','Masonry','Concrete'],
    adjectives: ['Lone Star','Sunshine','Pacific','Atlantic','Mountain','Valley','Premier','Elite','Pro','Expert','Master','Ace','Top','Quality','Superior','Gold','Silver','Platinum','Diamond','Sterling','Reliable','Dependable','Trusted','Veteran','Family','Heritage','Classic','Local','Metro','Urban','Suburban','Coastal','Highland','Riverside','Lakeside','Hillside','Meadow','Oak','Maple','Birch','Cedar','Willow','Elm','Pine','Spruce','Fir','Redwood','Sequoia','Ironwood','Stonework']
  },
  wine_agriculture: {
    key: 'wine_agriculture',
    words: ['Winery','Vineyard','Cellars','Estate','Winery & Vineyards','Wine Co.','Farm Winery','Wine Estate','Barrel Room','Crush Pad','Wine Garden','Farm','Ranch','Organic Farm','Family Farm','Agribusiness','Harvest Co.','Agricultural Group','Farm & Vineyard','Orchard'],
    adjectives: ['Hillside','Valley','Ridge','Summit','Sunrise','Sunset','Morning','Golden','Silver','Amber','Ruby','Crimson','Ivory','Jade','Emerald','Sapphire','Vineyard','Harvest','Vintage','Estate','Cellar','Barrel','Chateau','Domaine','Maison','Casa','Rancho','Terra','Sol','Luna','Stella','Aurora','Cascade','Olympic','Sierra','Rocky','Appalachian','Blue Ridge','Ozark','Black Hills','Flint Hills','Prairie','Meadow','Willow','Sage','Lavender','Rosemary','Basil','Thyme','Mint','Clover']
  }
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function toSlug(s) {
  return s.toLowerCase().replace(/[''']/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}
function randPhone(areas) {
  const area = areas[Math.floor(Math.random() * areas.length)];
  const p1 = String(100 + Math.floor(Math.random() * 800));
  const p2 = String(1000 + Math.floor(Math.random() * 9000));
  return `(${area}) ${p1}-${p2}`;
}
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Main generation ─────────────────────────────────────────────────────────
const usedEmails = new Set();
// Pre-load existing emails to avoid collisions
const existingPath = path.join(__dirname, 'usa_crm_import.json');
const existing = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
existing.forEach(c => usedEmails.add(c.email));

const contacts = [];
const epPool = ['info','contact','hello','team','office'];

// Build name pool
const namePool = shuffle(
  FIRST.flatMap(f => LAST.map(l => `${f} ${l}`))
).slice(0, 80000); // cap to avoid OOM
let nameIdx = 0;

for (const [nicheKey, niche] of Object.entries(NICHES)) {
  // Build company name pool: adjective + word (unique per niche)
  const compPool = shuffle(
    niche.adjectives.flatMap(adj => niche.words.map(w => `${adj} ${w}`))
  );
  let compIdx = 0;

  for (const state of STATES) {
    for (let i = 0; i < 200; i++) {
      // Pick company name, ensure globally unique email
      let company, slug, email;
      let tries = 0;
      do {
        company = compPool[compIdx % compPool.length];
        compIdx++;
        slug = toSlug(company);
        const ep = epPool[i % epPool.length];
        // Add state code suffix on collision
        const suffix = tries === 0 ? '' : `-${state.code.toLowerCase()}${tries > 1 ? tries : ''}`;
        email = `${ep}@${slug.replace(/-/g,'')}${suffix}.com`;
        tries++;
      } while (usedEmails.has(email) && tries < 20);

      usedEmails.add(email);

      const name = namePool[nameIdx % namePool.length];
      nameIdx++;
      const city = state.cities[i % state.cities.length];
      const website = i % 3 === 2 ? '' : `www.${slug.replace(/-/g,'')}.com`;

      contacts.push({
        name,
        email,
        phone: randPhone(state.areas),
        company,
        role: `Owner / Manager — ${state.name}`,
        status: 'lead',
        value: 0,
        notes: JSON.stringify({
          city,
          niche: niche.key,
          state: state.name,
          state_code: state.code,
          website,
          page: `companies/usa/${state.slug}/${slug}.html`,
          segment: 'usa'
        })
      });
    }
  }
  console.log(`  ${nicheKey}: ${200 * STATES.length} contacts generated`);
}

// Append to existing file
const merged = existing.concat(contacts);
fs.writeFileSync(existingPath, JSON.stringify(merged, null, 2));

// Summary
const byNiche = {};
contacts.forEach(c => {
  const n = JSON.parse(c.notes).niche;
  byNiche[n] = (byNiche[n] || 0) + 1;
});
console.log('\n✅ Done');
console.log(`Added: ${contacts.length} | Total in file: ${merged.length}`);
console.log('By niche:', byNiche);
