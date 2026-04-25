const LOGGING_MODE_DEV = 'DEV';
const LOGGING_MODE_PROD = 'PROD';
let LOGGING_MODE = LOGGING_MODE_PROD;

const SITE_DANBOORU = 'DANB';
const SITE_DERPIBOORU = 'DERP';
const SITE_E621 = 'E621';
const SITE_GELBOORU = 'GELB';
const SITE_KONACHAN = 'KONA';
const SITE_RULE34 = 'RULE';
const SITE_SAFEBOORU = 'SAFE';
const SITE_XBOORU = 'XBOO';
const SITE_YANDERE = 'YAND';
const SITE_TWITTER = 'TWIT';

const MEDIA_TYPE_IMAGE = 'IMAGE';
const MEDIA_TYPE_GIF = 'GIF';
const MEDIA_TYPE_VIDEO = 'VIDEO';
const MEDIA_TYPE_UNSUPPORTED = 'UNSUPPORTED';

const ENTER_KEY_ID = 13;
const SPACE_KEY_ID = 32;
const LEFT_ARROW_KEY_ID = 37;
const RIGHT_ARROW_KEY_ID = 39;
const A_KEY_ID = 65;
const D_KEY_ID = 68;
const S_KEY_ID = 83;
const W_KEY_ID = 87;
const F_KEY_ID = 70;
const L_KEY_ID = 76;
const G_KEY_ID = 71;
const E_KEY_ID = 69;
const R_KEY_ID = 82;

let SITE_QUERY_TERM_ASSOCIATIONS = {};

/* Leaving in for reference till this stuff is reworked.
SITE_QUERY_TERM_ASSOCIATIONS[SITE_ATFBOORU] = {
	"sort:id" : "order:id",
	"sort:id_asc" : "order:id_asc",
	"sort:id_desc" : "order:id_desc",
	"sort:score" : "order:score",
	"sort:score_asc" : "order:score_asc",
	"sort:score_desc" : "order:score_desc",
	"sort:-upload" : ""
};*/
SITE_QUERY_TERM_ASSOCIATIONS[SITE_DANBOORU] = {
	"sort:id" : "order:id",
	"sort:id_asc" : "order:id_asc",
	"sort:id_desc" : "order:id_desc",
	"sort:score" : "order:score",
	"sort:score_asc" : "order:score_asc",
	"sort:score_desc" : "order:score_desc",
	"sort:-upload" : ""
};
SITE_QUERY_TERM_ASSOCIATIONS[SITE_DERPIBOORU] = {
	"sort:id" : "",
	"sort:id_asc" : "",
	"sort:id_desc" : "",
	"sort:score" : "",
	"sort:score_asc" : "",
	"sort:score_desc" : "",
	"order:id" : "",
	"order:id_asc" : "",
	"order:id_desc" : "",
	"order:score" : "",
	"order:score_asc" : "",
	"order:score_desc" : "",
	"rating:s\\S*" : "safe",
	"rating:q\\S*" : "questionable",
	"rating:e\\S*" : "explicit",
	"sort:-upload" : ""
};
SITE_QUERY_TERM_ASSOCIATIONS[SITE_E621] = {
	"sort:id" : "order:id",
	"sort:id_asc" : "order:id_asc",
	"sort:id_desc" : "order:id_desc",
	"sort:score" : "order:score",
	"sort:score_asc" : "order:score_asc",
	"sort:score_desc" : "order:score_desc",
	"sort:-upload" : ""
};
SITE_QUERY_TERM_ASSOCIATIONS[SITE_GELBOORU] = {
	"rating:s\\S*" : "rating:safe",
	"rating:q\\S*" : "rating:questionable",
	"rating:e\\S*" : "rating:explicit",
	// Can't sort by ID
	
	// ASC/DESC not implemented?
	"order:score" : "sort:score",
	"order:score_desc" : "sort:score",
	"sort:score_desc" : "sort:score",
	"sort:-upload" : ""
};
SITE_QUERY_TERM_ASSOCIATIONS[SITE_KONACHAN] = {
	"sort:id" : "order:id",
	"sort:id_asc" : "order:id_asc",
	"sort:id_desc" : "order:id_desc",
	"sort:score" : "order:score",
	"sort:score_asc" : "order:score_asc",
	"sort:score_desc" : "order:score_desc",
	"sort:-upload" : ""
};
SITE_QUERY_TERM_ASSOCIATIONS[SITE_RULE34] = {
	"rating:s\\S*" : "rating:safe",
	"rating:q\\S*" : "rating:questionable",
	"rating:e\\S*" : "rating:explicit",
	"order:id" : "sort:id",
	"order:id_asc" : "sort:id_asc",
	"order:id_desc" : "sort:id_desc",
	"order:score" : "sort:score",
	"order:score_asc" : "sort:score_asc",
	"order:score_desc" : "sort:score_desc",
	"sort:-upload" : ""
};
SITE_QUERY_TERM_ASSOCIATIONS[SITE_SAFEBOORU] = {
	"rating:s\\S*" : "rating:safe",
	"rating:q\\S*" : "rating:questionable",
	"rating:e\\S*" : "rating:explicit",
	"order:id" : "sort:id",
	"order:id_asc" : "sort:id_asc",
	"order:id_desc" : "sort:id_desc",
	"order:score" : "sort:score",
	"order:score_asc" : "sort:score_asc",
	"order:score_desc" : "sort:score_desc",
	"sort:-upload" : ""
};
SITE_QUERY_TERM_ASSOCIATIONS[SITE_XBOORU] = {
	"rating:s\\S*" : "rating:safe",
	"rating:q\\S*" : "rating:questionable",
	"rating:e\\S*" : "rating:explicit",
	// Can't sort by ID
	
	// ASC/DESC not implemented?
	"order:score" : "sort:score",
	"order:score_desc" : "sort:score",
	"sort:score_desc" : "sort:score",
	"sort:-upload" : ""
};
SITE_QUERY_TERM_ASSOCIATIONS[SITE_YANDERE] = {
	"sort:id" : "order:id",
	"sort:id_asc" : "order:id_asc",
	"sort:id_desc" : "order:id_desc",
	"sort:score" : "order:score",
	"sort:score_asc" : "order:score_asc",
	"sort:score_desc" : "order:score_desc",
	"sort:-upload" : ""
}
