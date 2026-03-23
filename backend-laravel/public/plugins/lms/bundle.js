(function(t,e){'use strict';
var B=window.__APP_BRIDGE__||{},F=B.apiFetch||(async()=>{}),T=B.showToast||(()=>{}),RTE=(B.components||{}).RichTextEditor||null,MP=(B.components||{}).MediaPicker||null;
function fmt(v){return v?Number(v).toLocaleString('vi-VN')+'đ':'0đ';}
function fDate(d){return d?new Date(d).toLocaleDateString('vi-VN'):'-';}
var LVL={beginner:'Cơ bản',intermediate:'Trung cấp',advanced:'Nâng cao'};
// ═══ STATS ═══
var Stats={name:'LmsStats',setup(){var s=t.ref(null),ld=t.ref(true);t.onMounted(async()=>{try{s.value=(await(await F('/lms/stats')).json()).data}catch(e){}ld.value=false});return{s,ld}},
render(){var me=this;if(me.ld)return t.h('div',{class:'post-list__loading'},[t.h(e.Loader2,{size:24,class:'spin'}),' Đang tải...']);
if(!me.s)return t.h('div',{class:'post-list__empty'},[t.h(e.BarChart2,{size:48}),t.h('p',null,'Chưa có dữ liệu')]);
var cards=[{i:e.BookOpen,l:'Khoá học',v:me.s.totalCourses,c:'#8b5cf6'},{i:e.CheckCircle,l:'Đã xuất bản',v:me.s.publishedCourses,c:'#22c55e'},{i:e.Users,l:'Ghi danh',v:me.s.totalEnrollments,c:'#3b82f6'},{i:e.Award,l:'Hoàn thành',v:me.s.completedEnrollments,c:'#f59e0b'},{i:e.FileText,l:'Bài học',v:me.s.totalLessons,c:'#a855f7'}];
return t.h('div',null,[t.h('div',{class:'lm-stats-grid'},cards.map(c=>t.h('div',{class:'lm-stat-card'},[t.h('div',{class:'lm-stat-icon',style:'color:'+c.c+';background:'+c.c+'15'},[t.h(c.i,{size:22})]),t.h('div',{class:'lm-stat-num'},c.v||0),t.h('div',{class:'lm-stat-label'},c.l)]))),
me.s.topCourses&&me.s.topCourses.length?t.h('div',{class:'lm-top-courses'},[t.h('h3',{class:'lm-section-title'},[t.h(e.TrendingUp,{size:16}),' Khoá học nổi bật']),t.h('div',{class:'lm-top-list'},me.s.topCourses.map(c=>t.h('div',{class:'lm-top-item'},[t.h('span',{class:'lm-top-name'},c.title),t.h('span',{class:'lm-top-count'},c.enrollment_count+' học viên')])))]):null])}};
// ═══ COURSE LIST ═══
var CourseList={name:'LmsCourseList',emits:['edit'],setup(_,{emit:em}){
var items=t.ref([]),ld=t.ref(true),search=t.ref(''),page=t.ref(1),lastPage=t.ref(1),total=t.ref(0);var tm=null;
t.onMounted(load);
async function load(){ld.value=true;try{var p=new URLSearchParams({page:page.value,per_page:15});if(search.value)p.set('search',search.value);
var r=await(await F('/lms/courses?'+p)).json(),d=r.data||r;items.value=d.data||d;total.value=d.total||items.value.length;lastPage.value=d.last_page||1}catch(e){items.value=[]}ld.value=false}
function onSearch(){clearTimeout(tm);tm=setTimeout(()=>{page.value=1;load()},300)}
async function del(c){if(!confirm('Xoá "'+c.title+'"?'))return;try{await F('/lms/courses/'+c.id,{method:'DELETE'});T('Đã xoá','success');load()}catch(e){T('Lỗi','error')}}
return{items,ld,search,page,lastPage,total,load,onSearch,del}},
render(){var s=this;
var hdr=t.h('div',{class:'post-list__header'},[t.h('div',{class:'post-list__header-left'},[t.h(e.BookOpen,{size:22,class:'post-list__icon'}),t.h('h2',{class:'post-list__title'},'Khoá học ('+s.total+')')]),
t.h('button',{class:'post-list__create-btn',onClick:()=>s.$emit('edit',null)},[t.h(e.Plus,{size:16}),' Tạo khoá học'])]);
var filters=t.h('div',{class:'post-list__filters'},[t.h('div',{class:'post-list__search-wrap'},[t.h(e.Search,{size:16,class:'post-list__search-icon'}),t.h('input',{class:'post-list__search',placeholder:'Tìm khoá học...',value:s.search,onInput:ev=>{s.search=ev.target.value;s.onSearch()}})])]);
if(s.ld)return t.h('div',null,[hdr,filters,t.h('div',{class:'post-list__loading'},[t.h(e.Loader2,{size:24,class:'spin'}),' Đang tải...'])]);
if(!s.items.length)return t.h('div',null,[hdr,filters,t.h('div',{class:'post-list__empty'},[t.h(e.BookOpen,{size:48}),t.h('p',null,'Chưa có khoá học nào'),t.h('button',{class:'post-list__create-btn',onClick:()=>s.$emit('edit',null)},[t.h(e.Plus,{size:16}),' Tạo khoá học đầu tiên'])])]);
var tbl=t.h('div',{class:'post-list__table-wrap'},[t.h('table',{class:'post-list__table'},[t.h('thead',null,[t.h('tr',null,[t.h('th',{class:'post-list__th',style:'width:30%'},'Tên'),t.h('th',{class:'post-list__th'},'Cấp độ'),t.h('th',{class:'post-list__th'},'Giá'),t.h('th',{class:'post-list__th'},'Bài học'),t.h('th',{class:'post-list__th'},'Học viên'),t.h('th',{class:'post-list__th'},'Trạng thái'),t.h('th',{class:'post-list__th',style:'width:120px;text-align:center'},'Thao tác')])]),
t.h('tbody',null,s.items.map(c=>t.h('tr',{key:c.id,class:'post-list__row'},[
t.h('td',{class:'post-list__td'},[t.h('div',{class:'post-list__item-title',onClick:()=>s.$emit('edit',c)},c.title)]),
t.h('td',{class:'post-list__td'},[t.h('span',{class:'post-list__cat-badge'},LVL[c.level]||c.level)]),
t.h('td',{class:'post-list__td'},fmt(c.price)),
t.h('td',{class:'post-list__td'},String(c.lessons_count||c.lesson_count||0)),
t.h('td',{class:'post-list__td'},String(c.enrollments_count||c.enrollment_count||0)),
t.h('td',{class:'post-list__td'},[t.h('span',{class:'post-list__status post-list__status--'+(c.is_published?'published':'draft')},c.is_published?'Xuất bản':'Nháp')]),
t.h('td',{class:'post-list__td',style:'text-align:center'},[t.h('button',{class:'post-list__action',onClick:()=>s.$emit('edit',c),title:'Sửa'},[t.h(e.Pencil,{size:14})]),t.h('button',{class:'post-list__action post-list__action--danger',onClick:()=>s.del(c),title:'Xoá'},[t.h(e.Trash2,{size:14})])])])))])]);
var pag=s.lastPage>1?t.h('div',{class:'post-list__pagination'},Array.from({length:s.lastPage},(_,i)=>i+1).map(p=>t.h('button',{key:p,class:['post-list__page-btn',p===s.page?'post-list__page-btn--active':''],onClick:()=>{s.page=p;s.load()}},p))):null;
return t.h('div',null,[hdr,filters,tbl,pag])}};
// ═══ COURSE BUILDER ═══
var CourseBuilder={name:'LmsCourseBuilder',props:{courseId:{type:[Number,String],default:null}},emits:['back','saved'],
setup(props,{emit:em}){
var tab=t.ref('info'),course=t.ref({title:'',description:'',featured_image:'',price:0,is_published:false,instructor_name:'',duration_hours:null,level:'beginner',certificate_enabled:false}),
saving=t.ref(false),sections=t.ref([]),lessons=t.ref([]),loadingCurr=t.ref(false),
editLesson=t.ref(null),showLessonModal=t.ref(false),lessonForm=t.ref({}),
quizzes=t.ref([]),editQuiz=t.ref(null),showQuizModal=t.ref(false),quizForm=t.ref({title:'',passing_score:70,time_limit_minutes:null,max_attempts:null,shuffle_questions:false,questions:[]}),
showSectionModal=t.ref(false),sectionForm=t.ref({title:'',sort_order:0});
t.onMounted(async()=>{if(props.courseId){try{var r=await(await F('/lms/courses/'+props.courseId)).json();var d=r.data||r;Object.assign(course.value,d)}catch(e){T('Lỗi tải khoá học','error')}loadCurriculum()}});
async function loadCurriculum(){loadingCurr.value=true;try{var sr=await(await F('/lms/courses/'+props.courseId+'/sections')).json();sections.value=(sr.data||sr)||[];
var lr=await(await F('/lms/courses/'+props.courseId+'/lessons')).json();lessons.value=(lr.data||lr)||[]}catch(e){}loadingCurr.value=false}
async function saveCourse(){saving.value=true;try{var m=props.courseId?'PUT':'POST',u=props.courseId?'/lms/courses/'+props.courseId:'/lms/courses';
var r=await(await F(u,{method:m,body:JSON.stringify(course.value)})).json();T('Đã lưu','success');if(!props.courseId&&r.data)em('saved',r.data);else em('saved',course.value)}catch(e){T('Lỗi: '+e.message,'error')}saving.value=false}
// Sections
async function addSection(){try{var r=await(await F('/lms/courses/'+props.courseId+'/sections',{method:'POST',body:JSON.stringify(sectionForm.value)})).json();T('Đã tạo chương','success');showSectionModal.value=false;sectionForm.value={title:'',sort_order:sections.value.length};loadCurriculum()}catch(e){T('Lỗi','error')}}
async function deleteSection(id){if(!confirm('Xoá chương này?'))return;try{await F('/lms/courses/'+props.courseId+'/sections/'+id,{method:'DELETE'});T('Đã xoá','success');loadCurriculum()}catch(e){}}
// Lessons
function openAddLesson(sectionId){editLesson.value=null;lessonForm.value={title:'',content:'',video_url:'',duration_minutes:0,is_free:false,is_locked:false,section_id:sectionId,sort_order:lessons.value.length};showLessonModal.value=true}
function openEditLesson(l){editLesson.value=l.id;lessonForm.value=Object.assign({},l);showLessonModal.value=true}
async function saveLesson(){try{var m=editLesson.value?'PUT':'POST',u=editLesson.value?'/lms/courses/'+props.courseId+'/lessons/'+editLesson.value:'/lms/courses/'+props.courseId+'/lessons';
await F(u,{method:m,body:JSON.stringify(lessonForm.value)});T('Đã lưu bài học','success');showLessonModal.value=false;loadCurriculum()}catch(e){T('Lỗi','error')}}
async function deleteLesson(id){if(!confirm('Xoá bài học?'))return;try{await F('/lms/courses/'+props.courseId+'/lessons/'+id,{method:'DELETE'});T('Đã xoá','success');loadCurriculum()}catch(e){}}
// Quizzes
async function loadQuizzes(lessonId){try{var r=await(await F('/lms/courses/'+props.courseId+'/lessons/'+lessonId+'/quizzes')).json();quizzes.value=(r.data||r)||[]}catch(e){quizzes.value=[]}}
function openAddQuiz(lessonId){editQuiz.value=null;quizForm.value={title:'',passing_score:70,time_limit_minutes:null,max_attempts:null,shuffle_questions:false,questions:[],_lessonId:lessonId};showQuizModal.value=true}
function addQuestion(){quizForm.value.questions.push({question:'',type:'multiple_choice',options:['','','',''],correct_answer:'0',points:1,explanation:''})}
function removeQuestion(i){quizForm.value.questions.splice(i,1)}
async function saveQuiz(){try{var d=Object.assign({},quizForm.value);var lid=d._lessonId;delete d._lessonId;
d.questions=d.questions.map((q,i)=>{var r=Object.assign({},q);r.sort_order=i;if(r.type==='true_false'){r.options=['Đúng','Sai'];r.correct_answer=r.correct_answer||'0'}return r});
var m=editQuiz.value?'PUT':'POST',u=editQuiz.value?'/lms/courses/'+props.courseId+'/quizzes/'+editQuiz.value:'/lms/courses/'+props.courseId+'/lessons/'+lid+'/quizzes';
await F(u,{method:m,body:JSON.stringify(d)});T('Đã lưu quiz','success');showQuizModal.value=false}catch(e){T('Lỗi','error')}}
async function deleteQuiz(id){if(!confirm('Xoá quiz?'))return;try{await F('/lms/courses/'+props.courseId+'/quizzes/'+id,{method:'DELETE'});T('Đã xoá','success')}catch(e){}}
return{tab,course,saving,sections,lessons,loadingCurr,editLesson,showLessonModal,lessonForm,quizzes,editQuiz,showQuizModal,quizForm,showSectionModal,sectionForm,
saveCourse,addSection,deleteSection,openAddLesson,openEditLesson,saveLesson,deleteLesson,loadQuizzes,openAddQuiz,addQuestion,removeQuestion,saveQuiz,deleteQuiz,fmt}},
render(){var s=this;
var back=t.h('div',{class:'post-editor__header'},[t.h('button',{class:'post-editor__back',onClick:()=>s.$emit('back')},[t.h(e.ChevronLeft,{size:16}),' Quay lại']),t.h('h2',{class:'post-editor__title'},s.courseId?'Chỉnh sửa khoá học':'Tạo khoá học mới')]);
var tabs=t.h('div',{class:'lm-builder-tabs'},[
['info','Thông tin',e.FileText],['curriculum','Chương trình',e.List],['quiz','Câu hỏi',e.HelpCircle]
].map(([k,l,ic])=>t.h('button',{key:k,class:s.tab===k?'lm-btab lm-btab--active':'lm-btab',onClick:()=>{s.tab=k}},
[t.h(ic,{size:14}),' '+l])));
// INFO TAB
var infoTab=t.h('div',{class:'post-editor__body',style:'grid-template-columns:1fr 280px'},[
t.h('div',{class:'post-editor__main'},[
t.h('div',{class:'post-editor__field'},[t.h('label',{class:'post-editor__label'},'Tên khoá học *'),t.h('input',{class:'post-editor__input post-editor__input--title',value:s.course.title,onInput:ev=>s.course.title=ev.target.value,placeholder:'Nhập tên khoá học...'})]),
t.h('div',{class:'post-editor__field'},[t.h('label',{class:'post-editor__label'},'Mô tả'),RTE?t.h(RTE,{modelValue:s.course.description,'onUpdate:modelValue':v=>s.course.description=v}):t.h('textarea',{class:'post-editor__textarea',rows:8,value:s.course.description,onInput:ev=>s.course.description=ev.target.value,placeholder:'Mô tả chi tiết khoá học...'})]),
t.h('div',{style:'display:grid;grid-template-columns:1fr 1fr;gap:16px'},[
t.h('div',{class:'post-editor__field'},[t.h('label',{class:'post-editor__label'},'Giá'),t.h('input',{class:'post-editor__input',type:'number',value:s.course.price,onInput:ev=>s.course.price=Number(ev.target.value)})]),
t.h('div',{class:'post-editor__field'},[t.h('label',{class:'post-editor__label'},'Cấp độ'),t.h('select',{class:'post-editor__select',value:s.course.level,onChange:ev=>s.course.level=ev.target.value},[t.h('option',{value:'beginner'},'Cơ bản'),t.h('option',{value:'intermediate'},'Trung cấp'),t.h('option',{value:'advanced'},'Nâng cao')])])]),
t.h('div',{class:'post-editor__field'},[t.h('label',{class:'post-editor__label'},'Giảng viên'),t.h('input',{class:'post-editor__input',value:s.course.instructor_name||'',onInput:ev=>s.course.instructor_name=ev.target.value,placeholder:'Tên giảng viên...'})]),
t.h('div',{class:'post-editor__field'},[t.h('label',{class:'post-editor__label'},'Thời lượng (giờ)'),t.h('input',{class:'post-editor__input',type:'number',value:s.course.duration_hours||'',onInput:ev=>s.course.duration_hours=Number(ev.target.value)||null})])]),
t.h('div',{class:'post-editor__sidebar'},[
t.h('div',{class:'post-editor__card'},[t.h('h4',{class:'post-editor__card-title'},'Ảnh đại diện'),
s.course.featured_image?t.h('div',{class:'post-editor__img-preview'},[t.h('img',{src:s.course.featured_image}),t.h('button',{class:'post-editor__img-remove',onClick:()=>s.course.featured_image=''},'✕')]):null,
MP?t.h(MP,{modelValue:s.course.featured_image,'onUpdate:modelValue':v=>s.course.featured_image=v,accept:'image/*'}):t.h('input',{class:'post-editor__input',type:'text',value:s.course.featured_image||'',placeholder:'URL ảnh',onInput:ev=>s.course.featured_image=ev.target.value})]),
t.h('div',{class:'post-editor__card'},[t.h('h4',{class:'post-editor__card-title'},'Xuất bản'),
t.h('div',{class:'post-editor__checkbox-field'},[t.h('label',null,[t.h('input',{type:'checkbox',checked:s.course.is_published,onChange:ev=>s.course.is_published=ev.target.checked}),' Xuất bản khoá học'])]),
t.h('div',{class:'post-editor__checkbox-field',style:'margin-top:8px'},[t.h('label',null,[t.h('input',{type:'checkbox',checked:s.course.certificate_enabled,onChange:ev=>s.course.certificate_enabled=ev.target.checked}),' Cấp chứng chỉ'])])])])]);
// CURRICULUM TAB
var currTab;
if(!s.courseId){currTab=t.h('div',{class:'post-list__empty'},[t.h(e.Info,{size:48}),t.h('p',null,'Vui lòng lưu khoá học trước khi thêm chương trình')])}
else if(s.loadingCurr){currTab=t.h('div',{class:'post-list__loading'},[t.h(e.Loader2,{size:24,class:'spin'}),' Đang tải...'])}
else{var secs=s.sections.map(sec=>{var secLessons=s.lessons.filter(l=>l.section_id===sec.id);
return t.h('div',{key:sec.id,class:'lm-section-card'},[
t.h('div',{class:'lm-section-header'},[t.h(e.FolderOpen,{size:16}),t.h('strong',null,sec.title),t.h('span',{class:'lm-section-count'},secLessons.length+' bài'),
t.h('div',{style:'margin-left:auto;display:flex;gap:4px'},[t.h('button',{class:'post-list__action',onClick:()=>s.openAddLesson(sec.id),title:'Thêm bài'},[t.h(e.Plus,{size:14})]),t.h('button',{class:'post-list__action post-list__action--danger',onClick:()=>s.deleteSection(sec.id),title:'Xoá chương'},[t.h(e.Trash2,{size:14})])])]),
secLessons.length?t.h('div',{class:'lm-lessons-list'},secLessons.map((l,i)=>t.h('div',{key:l.id,class:'lm-lesson-item'},[
t.h('div',{class:'lm-lesson-num'},i+1),
t.h('div',{class:'lm-lesson-info'},[t.h('div',{class:'lm-lesson-title'},l.title),t.h('div',{class:'lm-lesson-meta'},[l.video_url?t.h('span',null,[t.h(e.Video,{size:11}),' Video']):null,l.duration_minutes?t.h('span',null,[t.h(e.Clock,{size:11}),' '+l.duration_minutes+'p']):null,l.is_free?t.h('span',{class:'lm-badge-free'},'Miễn phí'):null,l.is_locked?t.h('span',null,[t.h(e.Lock,{size:11})]):null])]),
t.h('div',{class:'lm-lesson-actions'},[t.h('button',{class:'post-list__action',onClick:()=>{s.loadQuizzes(l.id);s.openAddQuiz(l.id)},title:'Thêm Quiz'},[t.h(e.HelpCircle,{size:14})]),t.h('button',{class:'post-list__action',onClick:()=>s.openEditLesson(l),title:'Sửa'},[t.h(e.Pencil,{size:14})]),t.h('button',{class:'post-list__action post-list__action--danger',onClick:()=>s.deleteLesson(l.id),title:'Xoá'},[t.h(e.Trash2,{size:14})])])]))):t.h('div',{class:'lm-empty-sec'},'Chưa có bài học')])});
var unassigned=s.lessons.filter(l=>!l.section_id);
if(unassigned.length)secs.push(t.h('div',{class:'lm-section-card lm-section-card--unassigned'},[t.h('div',{class:'lm-section-header'},[t.h(e.AlertCircle,{size:16}),t.h('strong',null,'Chưa phân chương ('+unassigned.length+')')]),
t.h('div',{class:'lm-lessons-list'},unassigned.map((l,i)=>t.h('div',{key:l.id,class:'lm-lesson-item'},[t.h('div',{class:'lm-lesson-num'},i+1),t.h('div',{class:'lm-lesson-info'},[t.h('div',{class:'lm-lesson-title'},l.title)]),t.h('div',{class:'lm-lesson-actions'},[t.h('button',{class:'post-list__action',onClick:()=>s.openEditLesson(l)},[t.h(e.Pencil,{size:14})]),t.h('button',{class:'post-list__action post-list__action--danger',onClick:()=>s.deleteLesson(l.id)},[t.h(e.Trash2,{size:14})])])])))]));
currTab=t.h('div',null,[t.h('div',{class:'lm-curr-actions'},[t.h('button',{class:'post-list__create-btn',onClick:()=>{s.sectionForm={title:'',sort_order:s.sections.length};s.showSectionModal=true}},[t.h(e.FolderPlus,{size:16}),' Thêm chương']),t.h('button',{class:'post-editor__btn post-editor__btn--sec',onClick:()=>s.openAddLesson(null)},[t.h(e.Plus,{size:14}),' Thêm bài học'])]),
t.h('div',{class:'lm-curriculum'},secs)])}
// QUIZ TAB  
var quizTab=!s.courseId?t.h('div',{class:'post-list__empty'},[t.h(e.Info,{size:48}),t.h('p',null,'Chọn bài học trong tab Chương trình để thêm quiz')]):
t.h('div',{class:'post-list__empty'},[t.h(e.HelpCircle,{size:48}),t.h('p',null,'Chọn bài học trong tab "Chương trình", nhấn nút quiz để thêm câu hỏi')]);
// MODALS
var lessonModal=null;
if(s.showLessonModal){lessonModal=t.h('div',{class:'lm-modal-overlay',onClick:ev=>{if(ev.target===ev.currentTarget)s.showLessonModal=false}},[t.h('div',{class:'lm-modal lm-modal--wide'},[
t.h('div',{class:'lm-modal-header'},[t.h('h3',null,[s.editLesson?t.h(e.Pencil,{size:16}):t.h(e.Plus,{size:16}),' ',s.editLesson?'Sửa bài học':'Thêm bài học']),t.h('button',{class:'lm-modal-close',onClick:()=>{s.showLessonModal=false}},[t.h(e.X,{size:18})])]),
t.h('div',{class:'lm-modal-body'},[
t.h('div',{class:'post-editor__field'},[t.h('label',{class:'post-editor__label'},'Tiêu đề *'),t.h('input',{class:'post-editor__input',value:s.lessonForm.title,onInput:ev=>s.lessonForm.title=ev.target.value})]),
t.h('div',{class:'post-editor__field'},[t.h('label',{class:'post-editor__label'},'Nội dung'),RTE?t.h(RTE,{modelValue:s.lessonForm.content||'','onUpdate:modelValue':v=>s.lessonForm.content=v}):t.h('textarea',{class:'post-editor__textarea',rows:6,value:s.lessonForm.content||'',onInput:ev=>s.lessonForm.content=ev.target.value})]),
t.h('div',{class:'post-editor__field'},[t.h('label',{class:'post-editor__label'},[t.h(e.Video,{size:12}),' Video']),MP?t.h(MP,{modelValue:s.lessonForm.video_url||'','onUpdate:modelValue':v=>s.lessonForm.video_url=v,accept:'video/*'}):t.h('input',{class:'post-editor__input',value:s.lessonForm.video_url||'',placeholder:'URL video hoặc chọn từ Media',onInput:ev=>s.lessonForm.video_url=ev.target.value})]),
t.h('div',{style:'display:grid;grid-template-columns:1fr 1fr;gap:12px'},[t.h('div',{class:'post-editor__field'},[t.h('label',{class:'post-editor__label'},'Thời lượng (phút)'),t.h('input',{class:'post-editor__input',type:'number',value:s.lessonForm.duration_minutes||0,onInput:ev=>s.lessonForm.duration_minutes=Number(ev.target.value)})]),
t.h('div',{class:'post-editor__field'},[t.h('label',{class:'post-editor__label'},'Thứ tự'),t.h('input',{class:'post-editor__input',type:'number',value:s.lessonForm.sort_order||0,onInput:ev=>s.lessonForm.sort_order=Number(ev.target.value)})])]),
t.h('div',{style:'display:flex;gap:16px;margin-top:8px'},[t.h('label',{class:'post-editor__checkbox-field'},[t.h('input',{type:'checkbox',checked:s.lessonForm.is_free,onChange:ev=>s.lessonForm.is_free=ev.target.checked}),' Miễn phí']),
t.h('label',{class:'post-editor__checkbox-field'},[t.h('input',{type:'checkbox',checked:s.lessonForm.is_locked,onChange:ev=>s.lessonForm.is_locked=ev.target.checked}),' Khóa bài'])])]),
t.h('div',{class:'lm-modal-footer'},[t.h('button',{class:'post-editor__btn post-editor__btn--sec',onClick:()=>{s.showLessonModal=false}},'Huỷ'),t.h('button',{class:'post-editor__btn post-editor__btn--pri',onClick:s.saveLesson},[t.h(e.Save,{size:14}),' Lưu'])])])])}
// Section modal
var secModal=null;
if(s.showSectionModal){secModal=t.h('div',{class:'lm-modal-overlay',onClick:ev=>{if(ev.target===ev.currentTarget)s.showSectionModal=false}},[t.h('div',{class:'lm-modal'},[
t.h('div',{class:'lm-modal-header'},[t.h('h3',null,[t.h(e.FolderPlus,{size:16}),' Thêm chương']),t.h('button',{class:'lm-modal-close',onClick:()=>{s.showSectionModal=false}},[t.h(e.X,{size:18})])]),
t.h('div',{class:'lm-modal-body'},[t.h('div',{class:'post-editor__field'},[t.h('label',{class:'post-editor__label'},'Tên chương *'),t.h('input',{class:'post-editor__input',value:s.sectionForm.title,onInput:ev=>s.sectionForm.title=ev.target.value,placeholder:'Ví dụ: Chương 1 - Giới thiệu'})])]),
t.h('div',{class:'lm-modal-footer'},[t.h('button',{class:'post-editor__btn post-editor__btn--sec',onClick:()=>{s.showSectionModal=false}},'Huỷ'),t.h('button',{class:'post-editor__btn post-editor__btn--pri',onClick:s.addSection},[t.h(e.Save,{size:14}),' Tạo'])])])])}
// Quiz modal
var quizModal=null;
if(s.showQuizModal){var qs=s.quizForm.questions||[];
quizModal=t.h('div',{class:'lm-modal-overlay',onClick:ev=>{if(ev.target===ev.currentTarget)s.showQuizModal=false}},[t.h('div',{class:'lm-modal lm-modal--wide'},[
t.h('div',{class:'lm-modal-header'},[t.h('h3',null,[t.h(e.HelpCircle,{size:16}),' Tạo Quiz']),t.h('button',{class:'lm-modal-close',onClick:()=>{s.showQuizModal=false}},[t.h(e.X,{size:18})])]),
t.h('div',{class:'lm-modal-body',style:'max-height:60vh;overflow-y:auto'},[
t.h('div',{class:'post-editor__field'},[t.h('label',{class:'post-editor__label'},'Tiêu đề Quiz'),t.h('input',{class:'post-editor__input',value:s.quizForm.title,onInput:ev=>s.quizForm.title=ev.target.value})]),
t.h('div',{style:'display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px'},[
t.h('div',{class:'post-editor__field'},[t.h('label',{class:'post-editor__label'},'Điểm đạt (%)'),t.h('input',{class:'post-editor__input',type:'number',min:0,max:100,value:s.quizForm.passing_score,onInput:ev=>s.quizForm.passing_score=Number(ev.target.value)})]),
t.h('div',{class:'post-editor__field'},[t.h('label',{class:'post-editor__label'},'Thời gian (phút)'),t.h('input',{class:'post-editor__input',type:'number',value:s.quizForm.time_limit_minutes||'',onInput:ev=>s.quizForm.time_limit_minutes=Number(ev.target.value)||null})]),
t.h('div',{class:'post-editor__field'},[t.h('label',{class:'post-editor__label'},'Số lần làm'),t.h('input',{class:'post-editor__input',type:'number',value:s.quizForm.max_attempts||'',onInput:ev=>s.quizForm.max_attempts=Number(ev.target.value)||null})])]),
t.h('label',{class:'post-editor__checkbox-field',style:'margin-bottom:16px'},[t.h('input',{type:'checkbox',checked:s.quizForm.shuffle_questions,onChange:ev=>s.quizForm.shuffle_questions=ev.target.checked}),' Trộn câu hỏi']),
t.h('div',{class:'lm-quiz-qlist'},[t.h('div',{style:'display:flex;justify-content:space-between;align-items:center;margin-bottom:12px'},[t.h('h4',{class:'post-editor__label',style:'margin:0'},'CÂU HỎI ('+qs.length+')'),t.h('button',{class:'post-editor__btn post-editor__btn--sec',onClick:s.addQuestion},[t.h(e.Plus,{size:14}),' Thêm câu'])]),
qs.map((q,i)=>t.h('div',{key:i,class:'lm-question-card'},[
t.h('div',{class:'lm-q-header'},[t.h('span',{class:'lm-q-num'},'Câu '+(i+1)),t.h('select',{class:'post-editor__select',style:'width:160px',value:q.type,onChange:ev=>{q.type=ev.target.value;if(ev.target.value==='true_false')q.options=['Đúng','Sai']}},[t.h('option',{value:'multiple_choice'},'Trắc nghiệm'),t.h('option',{value:'true_false'},'Đúng/Sai'),t.h('option',{value:'multi_select'},'Nhiều đáp án'),t.h('option',{value:'text'},'Tự luận')]),
t.h('button',{class:'post-list__action post-list__action--danger',onClick:()=>s.removeQuestion(i)},[t.h(e.Trash2,{size:14})])]),
t.h('div',{class:'post-editor__field'},[t.h('textarea',{class:'post-editor__textarea post-editor__textarea--sm',rows:2,value:q.question,placeholder:'Nội dung câu hỏi...',onInput:ev=>q.question=ev.target.value})]),
q.type!=='text'?t.h('div',{class:'lm-q-options'},(q.options||[]).map((opt,oi)=>t.h('div',{key:oi,class:'lm-q-opt'},[t.h('input',{type:q.type==='multi_select'?'checkbox':'radio',name:'q'+i,checked:String(q.correct_answer)===String(oi),onChange:()=>{q.correct_answer=String(oi)}}),t.h('input',{class:'post-editor__input',style:'flex:1',value:opt,onInput:ev=>{q.options[oi]=ev.target.value},placeholder:'Đáp án '+(oi+1)}),
q.type!=='true_false'?t.h('button',{class:'lm-q-opt-del',onClick:()=>q.options.splice(oi,1)},[t.h(e.X,{size:12})]):null]))):null,
q.type!=='text'&&q.type!=='true_false'?t.h('button',{class:'lm-add-opt',onClick:()=>q.options.push('')},[t.h(e.Plus,{size:12}),' Thêm đáp án']):null,
t.h('div',{class:'post-editor__field',style:'margin-top:8px'},[t.h('input',{class:'post-editor__input',value:q.explanation||'',placeholder:'Giải thích (tuỳ chọn)',onInput:ev=>q.explanation=ev.target.value})])]))])]),
t.h('div',{class:'lm-modal-footer'},[t.h('button',{class:'post-editor__btn post-editor__btn--sec',onClick:()=>{s.showQuizModal=false}},'Huỷ'),t.h('button',{class:'post-editor__btn post-editor__btn--pri',onClick:s.saveQuiz},[t.h(e.Save,{size:14}),' Lưu Quiz'])])])])}
// ACTIONS BAR
var actions=t.h('div',{class:'post-editor__actions'},[t.h('button',{class:'post-editor__btn post-editor__btn--sec',onClick:()=>s.$emit('back')},'Huỷ'),
t.h('button',{class:'post-editor__btn post-editor__btn--pri',onClick:s.saveCourse,disabled:s.saving},[s.saving?t.h(e.Loader2,{size:14,class:'spin'}):t.h(e.Save,{size:14}),s.saving?' Đang lưu...'  :' Lưu khoá học'])]);
return t.h('div',{class:'lms-builder'},[back,tabs,s.tab==='info'?infoTab:s.tab==='curriculum'?currTab:quizTab,actions,lessonModal,secModal,quizModal])}};
// ═══ ENROLLMENTS ═══
var Enrollments={name:'LmsEnrollments',setup(){
var items=t.ref([]),ld=t.ref(true),courses=t.ref([]),filter=t.ref({course_id:'',status:''});
t.onMounted(()=>{load();loadCourses()});
async function loadCourses(){try{var r=await(await F('/lms/courses?per_page=100')).json();var d=r.data||r;courses.value=d.data||d}catch(e){}}
async function load(){ld.value=true;try{var p=new URLSearchParams();if(filter.value.course_id)p.set('course_id',filter.value.course_id);if(filter.value.status)p.set('status',filter.value.status);
var r=await(await F('/lms/enrollments?'+p)).json();var d=r.data||r;items.value=d.data||d}catch(e){items.value=[]}ld.value=false}
async function updateStatus(id,st){try{await F('/lms/enrollments/'+id,{method:'PUT',body:JSON.stringify({status:st})});T('Đã cập nhật','success');load()}catch(e){}}
async function del(id){if(!confirm('Xoá ghi danh?'))return;try{await F('/lms/enrollments/'+id,{method:'DELETE'});T('Đã xoá','success');load()}catch(e){}}
return{items,ld,courses,filter,load,updateStatus,del}},
render(){var s=this;
var hdr=t.h('div',{class:'post-list__header'},[t.h('div',{class:'post-list__header-left'},[t.h(e.Users,{size:22,class:'post-list__icon'}),t.h('h2',{class:'post-list__title'},'Học viên ('+s.items.length+')')])]);
var filters=t.h('div',{class:'post-list__filters'},[
t.h('select',{class:'post-list__select',value:s.filter.course_id,onChange:ev=>{s.filter.course_id=ev.target.value;s.load()}},[t.h('option',{value:''},'Tất cả khoá học')].concat(s.courses.map(c=>t.h('option',{value:c.id,key:c.id},c.title)))),
t.h('select',{class:'post-list__select',value:s.filter.status,onChange:ev=>{s.filter.status=ev.target.value;s.load()}},[t.h('option',{value:''},'Tất cả'),t.h('option',{value:'active'},'Đang học'),t.h('option',{value:'completed'},'Hoàn thành'),t.h('option',{value:'cancelled'},'Đã huỷ')])]);
if(s.ld)return t.h('div',null,[hdr,filters,t.h('div',{class:'post-list__loading'},[t.h(e.Loader2,{size:24,class:'spin'})])]);
if(!s.items.length)return t.h('div',null,[hdr,filters,t.h('div',{class:'post-list__empty'},[t.h(e.Users,{size:48}),t.h('p',null,'Chưa có học viên nào')])]);
var tbl=t.h('div',{class:'post-list__table-wrap'},[t.h('table',{class:'post-list__table'},[t.h('thead',null,[t.h('tr',null,[t.h('th',{class:'post-list__th'},'Học viên'),t.h('th',{class:'post-list__th'},'Email'),t.h('th',{class:'post-list__th'},'Khoá học'),t.h('th',{class:'post-list__th'},'Tiến độ'),t.h('th',{class:'post-list__th'},'Trạng thái'),t.h('th',{class:'post-list__th'},'Ngày'),t.h('th',{class:'post-list__th',style:'text-align:center'},'Thao tác')])]),
t.h('tbody',null,s.items.map(en=>t.h('tr',{key:en.id,class:'post-list__row'},[
t.h('td',{class:'post-list__td'},[t.h('strong',null,en.student_name)]),
t.h('td',{class:'post-list__td'},en.student_email||'-'),
t.h('td',{class:'post-list__td'},en.course?en.course.title:'-'),
t.h('td',{class:'post-list__td'},[t.h('div',{class:'lm-progress'},[t.h('div',{class:'lm-progress-bar',style:'width:'+(en.progress_percent||0)+'%'}),t.h('span',null,(en.progress_percent||0)+'%')])]),
t.h('td',{class:'post-list__td'},[t.h('select',{class:'post-editor__select',value:en.status,onChange:ev=>s.updateStatus(en.id,ev.target.value),style:'font-size:12px;padding:4px 8px'},[t.h('option',{value:'active'},'Đang học'),t.h('option',{value:'completed'},'Hoàn thành'),t.h('option',{value:'cancelled'},'Đã huỷ')])]),
t.h('td',{class:'post-list__td post-list__td--date'},fDate(en.enrolled_at)),
t.h('td',{class:'post-list__td',style:'text-align:center'},[t.h('button',{class:'post-list__action post-list__action--danger',onClick:()=>s.del(en.id)},[t.h(e.Trash2,{size:14})])])])))])]);
return t.h('div',null,[hdr,filters,tbl])}};
// ═══ MAIN MANAGER ═══
var Mgr={name:'LmsManager',components:{Stats,CourseList,CourseBuilder,Enrollments},
setup(){var view=t.ref('stats'),editCourse=t.ref(null);
function goEdit(c){editCourse.value=c;view.value='builder'}
function goBack(){editCourse.value=null;view.value='courses'}
function onSaved(c){if(!editCourse.value&&c&&c.id){editCourse.value=c}goBack()}
return{view,editCourse,goEdit,goBack,onSaved}},
render(){var s=this;
var tabs=t.h('div',{class:'lm-builder-tabs',style:'margin-bottom:20px'},[
['stats','Tổng quan',e.BarChart2],['courses','Khoá học',e.BookOpen],['enrollments','Học viên',e.Users]
].map(([k,l,ic])=>t.h('button',{key:k,class:s.view===k?'lm-btab lm-btab--active':'lm-btab',onClick:()=>{s.view=k;s.editCourse=null}},[t.h(ic,{size:14}),' '+l])));
if(s.view==='builder')return t.h(CourseBuilder,{courseId:s.editCourse?s.editCourse.id:null,onBack:s.goBack,onSaved:s.onSaved});
return t.h('div',{class:'lms-plugin'},[tabs,
s.view==='stats'?t.h(Stats):s.view==='courses'?t.h(CourseList,{onEdit:s.goEdit}):t.h(Enrollments)])}};
// ═══ REGISTER ═══
var hooks=(B&&B.hooks)||window.__APP_HOOKS__;
if(hooks){hooks.addFilter('sidebar_items',function(i){i.push({key:'lms/dashboard',label:'LMS',icon:'GraduationCap',featureGroup:'store',moduleId:'lms'});return i});
hooks.addFilter('admin_routes',function(c){Object.assign(c.routeToTab,{'lms/dashboard':'lms'});return c})}
var plugin={id:'lms',name:'Quản lý Học trực tuyến',version:'3.0.0',components:{'lms':t.markRaw(Mgr)},
sidebar:{group:'Học tập',items:[{key:'lms-dashboard',label:'LMS',icon:'GraduationCap',route:'lms/dashboard'}]}};
window.__PLUGIN_REGISTRY__=window.__PLUGIN_REGISTRY__||{};window.__PLUGIN_REGISTRY__['lms']=plugin;
window.dispatchEvent(new CustomEvent('plugin:loaded',{detail:{id:'lms',plugin:plugin}}));
console.log('[Plugin:lms] LMS v3.0 loaded (Course Builder + Quiz + Enrollments)');return plugin;
})(Vue,LucideVueNext);
