<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Web\CoursesController;
use App\Http\Controllers\Web\TopicsController;
use App\Http\Controllers\Web\LessonsController;
use App\Http\Controllers\Web\TheoryLessonController;
use App\Http\Controllers\Web\LabLessonController;
use App\Http\Controllers\Web\LabLessonQuestionController;
use App\Http\Controllers\Web\NodesController;
use App\Http\Controllers\Web\UsersAdminController;
use App\Http\Controllers\Web\TaskController;
use App\Http\Controllers\Web\UsersController;
use App\Http\Controllers\Web\UserVmsController;
use App\Http\Controllers\Web\TournamentsController;


use App\Http\Controllers\Web\Admin\VmsController;
use App\Http\Controllers\Web\Admin\CloudController;
use App\Http\Controllers\Web\Admin\TournamentsController as AdminTournaments;
use App\Http\Controllers\Web\Admin\TopicsController as AdminTopics;
use App\Http\Controllers\Web\Admin\NodesController as AdminNodes;
use App\Http\Controllers\Web\Admin\LessonsController as AdminLesson;
use App\Http\Controllers\Web\Admin\TheoryLessonController as AdminTheory;
use App\Http\Controllers\Web\Admin\LabLessonController as AdminLabLesson;
use App\Http\Controllers\Web\Admin\LabLessonQuestionController as AdminLessonLabLessonQuestion;
use App\Http\Controllers\Web\Admin\LabLessonQuestionHintController as AdminLessonLabLessonQuestionHint;
use App\Http\Controllers\VerifyController;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Support\Facades\Password;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use App\Http\Middleware\AdminAccess;
/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

//demo
//admin routes


//lessons


Route::middleware(['auth', AdminAccess::class])->prefix('admin')->group(function () {

	Route::get('topics', [AdminTopics::class, 'list'])->name('admin-list-topics');
	Route::get('topics/new', [AdminTopics::class, 'new'])->name('admin-new-topic');
	Route::get('topics/{topic_id}',[AdminTopics::class, 'edit'])->name('admin-edit-topic');
	Route::post('topics', [AdminTopics::class, 'create'])->name('admin-add-new-topic');
	Route::put('topics/{topic_id}', [AdminTopics::class, 'update'])->name('admin-update-topic');
	Route::put('topics/{topic_id}/increase', [AdminTopics::class, 'increase'])->name('admin-update-topic-order-increase');
	Route::put('topics/{topic_id}/decrease', [AdminTopics::class, 'decrease'])->name('admin-update-topic-order-decrease');
	Route::delete('topics/{topic_id}', [AdminTopics::class, 'delete'])->name('admin-delete-topic');


//tournaments

	Route::get('tournaments', [AdminTournaments::class, 'list'])->name('admin-list-tournaments');
	Route::get('tournaments/new', [AdminTournaments::class, 'new'])->name('admin-new-tournament');
	Route::get('tournaments/{id}',[AdminTournaments::class, 'edit'])->name('admin-edit-tournament');
	Route::post('tournaments', [AdminTournaments::class, 'create'])->name('admin-add-new-tournament');
	Route::put('tournaments/{id}', [AdminTournaments::class, 'update'])->name('admin-update-tournament');
	Route::delete('tournaments/{id}', [AdminTournaments::class, 'delete'])->name('admin-delete-tournament');




	//node controller
	
	Route::get('topics/{topic_id}/lessons', [AdminNodes::class, 'get'])->name('admin-nodes');
	Route::put('topics/{topic_id}/lessons', [AdminNodes::class, 'update'])->name('admin-nodes-update');

	//node tournament 
	Route::get('tournaments/{topic_id}/lessons', [AdminNodes::class, 'get'])->name('admin-tournaments-nodes');
	Route::put('tournaments/{topic_id}/lessons', [AdminNodes::class, 'update'])->name('admin-tournaments-nodes-update');
	
	

	//admin cloud-tasks monitor
	Route::get('/cloud/tasks', [CloudController::class, 'monitor'])->name('monitor-task');
	Route::put('/cloud/tasks/{task_id}', [CloudController::class, 'update_cloud_task'])->name('update-cloud-task');




	//vms updates
	Route::get('/vms', [VmsController::class, 'get'])->name('vms');
	Route::post('/vms', [VmsController::class, 'create'])->name('create-vms');
	Route::put('/vms/{id}', [VmsController::class, 'update'])->name('update-vms');
	Route::delete('/vms/{id}', [VmsController::class, 'delete'])->name('delete-vms');



	//users
	Route::get('/user', [UsersAdminController::class, 'get'])->name('admin-users');
	Route::post('/user', [UsersAdminController::class, 'create'])->name('admin-create-user');
	Route::put('/user/{id}', [UsersAdminController::class, 'update'])->name('admin-update-user');
	Route::put('/user/{id}/reset', [UsersAdminController::class, 'reset'])->name('admin-reset-user');
	Route::delete('/user/{id}', [UsersAdminController::class, 'delete'])->name('admin-delete-user');

	//general lessons administration
	
	Route::get('lessons', [AdminLesson::class, 'list'])->name('admin-view-lessons');



	//admin theory lesson 
	Route::get('lessons/theory', [AdminTheory::class, 'new'])->name('admin-new-theory-lesson');
	Route::get('lessons/theory/{id}',[AdminTheory::class, 'edit'])->name('admin-edit-theory-lesson');
	Route::post('lessons/theory', [AdminTheory::class, 'create'])->name('admin-add-new-theory-lesson');
	Route::put('lessons/theory/{id}', [AdminTheory::class, 'update'])->name('admin-update-theory-lesson');

	//admin practice lesson
	Route::get('lessons/lab', [AdminLabLesson::class, 'new'])->name('admin-new-lab-lesson');
	Route::get('lessons/lab/{id}',[AdminLabLesson::class, 'edit'])->name('admin-edit-lab-lesson');
	Route::post('lessons/lab', [AdminLabLesson::class, 'create'])->name('admin-add-new-lab-lesson');
	Route::put('lessons/lab/{id}', [AdminLabLesson::class, 'update'])->name('admin-update-lab-lesson');
	
	Route::get('lessons/{id}', [AdminLesson::class, 'view'])->name('admin-view-lesson');
	Route::delete('lessons/{id}', [AdminLesson::class, 'delete'])->name('admin-delete-lesson');



	//admin general delete
	Route::delete('topics/{topic_id}/lesson/{lesson_id}', [LessonsController::class, 'delete'])->name('delete-lesson');
	
	
	
	//admin edit questions
	Route::get('lessons/lab/{id}/questions', [AdminLessonLabLessonQuestion::class, 'list'])->name('admin-list-lab-lesson-questions');
	Route::get('lessons/lab/{id}/questions/new', [AdminLessonLabLessonQuestion::class, 'new'])->name('admin-new-lab-lesson-questions');
	Route::get('lessons/lab/{id}/questions/{question_id}', [AdminLessonLabLessonQuestion::class, 'edit'])->name('admin-edit-lab-lesson-questions');

	Route::post('lessons/lab/{id}/questions', [AdminLessonLabLessonQuestion::class, 'create'])->name('admin-create-lab-lesson-questions');

	Route::put('lessons/lab/{id}/questions/{question_id}', [AdminLessonLabLessonQuestion::class, 'update'])->name('admin-update-lab-lesson-questions');
	Route::delete('lessons/lab/{id}/questions/{question_id}', [AdminLessonLabLessonQuestion::class, 'delete'])->name('admin-delete-lab-lesson-questions');
	Route::put('lessons/lab/{id}/questions/{question_id}/inc', [AdminLessonLabLessonQuestion::class, 'increase'])->name('admin-inc-order-lab-lesson-questions');
	Route::put('lessons/lab/{id}/questions/{question_id}/dec', [AdminLessonLabLessonQuestion::class, 'decrease'])->name('admin-dec-order-lab-lesson-questions');

	//admin hints
	Route::get('/questions/{question_id}/hints', [AdminLessonLabLessonQuestionHint::class, 'list'])->name('admin-list-lab-lesson-question-hints');
	Route::get('/questions/{question_id}/hints/new', [AdminLessonLabLessonQuestionHint::class, 'new'])->name('admin-new-lab-lesson-question-hints');
	Route::get('/questions/{question_id}/hints/{hint_id}', [AdminLessonLabLessonQuestionHint::class, 'edit'])->name('admin-edit-lab-lesson-question-hints');
	Route::post('/questions/{question_id}/hints', [AdminLessonLabLessonQuestionHint::class, 'create'])->name('admin-create-lab-lesson-question-hints');
	Route::put('/questions/{question_id}/hints/{hint_id}', [AdminLessonLabLessonQuestionHint::class, 'update'])->name('admin-update-lab-lesson-question-hints');
	Route::delete('/questions/{question_id}/hints/{hint_id}', [AdminLessonLabLessonQuestionHint::class, 'delete'])->name('admin-delete-lab-lesson-question-hints');
	Route::put('/questions/{question_id}/hints/{hint_id}/inc', [AdminLessonLabLessonQuestionHint::class, 'increase'])->name('admin-inc-order-lab-lesson-question-hints');
	Route::put('/questions/{question_id}/hints/{hint_id}/dec', [AdminLessonLabLessonQuestionHint::class, 'decrease'])->name('admin-dec-order-lab-lesson-question-hints');

});

Route::middleware(['auth','verified'])->group(function () {

	Route::get('topics',[TopicsController::class, 'list'])->name('topics');
	Route::get('topics/{topic_id}', [NodesController::class, 'list'])->name('lessons');
	Route::get('topics/{topic_id}/lessons', [NodesController::class, 'list'])->name('lessons');
	Route::get('topics/{topic_id}/lessons/{node_id}', [NodesController::class, 'view'])->name('view-lesson');
	//actions
	Route::put('topics/{topic_id}/lessons/{lesson_id}/{node_id}/done', [TheoryLessonController::class, 'mark_as_done'])->name('mark-theory-as-read');
	Route::put('topics/{topic_id}/lessons/{lesson_id}/{node_id}/cancel', [TheoryLessonController::class, 'mark_as_canceled'])->name('mark-theory-as-canceled');
	
	
	
	
	
	
	
	Route::post('topics/{topic_id}/lessons/{node_id}', [LabLessonQuestionController::class, 'answer'])->name('question-answer');
	Route::post('topics/{topic_id}/lessons/{node_id}/{question_id}/{hint_id}', [LabLessonQuestionController::class, 'hint'])->name('question-hint');
	
	//tournaments
	
	Route::get('tournaments', [TournamentsController::class, 'list'])->name('list-tournaments');
	Route::get('tournaments/{id}', [TournamentsController::class, 'view'])->name('view-tournament');
	Route::get('tournaments/{id}/task/{node_id}', [NodesController::class, 'view'])->name('view-tournament-task');
	
	
	Route::get('tournaments/archived', [TournamentsController::class, 'list_archived'])->name('list-archived-tournaments');
	Route::get('tournaments/archived/{id}', [TournamentsController::class, 'view_archived'])->name('view-archived-tournaments');
	
	
	
	//tasks
	Route::post('/task/{node_id}', [TaskController::class, 'start'])->name('start-task');
	Route::delete('/task/{node_id}', [TaskController::class, 'stop'])->name('stop-task');
	//user pages
	Route::get('users/{id}/edit',[UsersController::class, 'edit'])->name('edit-user-page');
	Route::put('users/{id}',[UsersController::class, 'update'])->name('update-user-page');

});

Route::get('users/{id}',[UsersController::class, 'get'])->name('user-page');
Route::get('users', [UsersController::class, 'list'])->name('users');

Route::get('login', function () {    return view('auth.login');})->name('login');
Route::get('register', function () {    return view('auth.register');})->name('register');
Route::post('login', [AuthController::class, 'authentificate']);
Route::post('register', [AuthController::class, 'register']);
Route::delete('logout', [AuthController::class, 'logout'])->name('logout');


Route::get('/auth/{driver}/redirect', function (Request $request, $driver) {
    return Socialite::driver($driver)->redirect();
});


Route::get('/auth/{driver}/callback',[AuthController::class, 'social_login']);




Route::get('/', function () {   return redirect()->route('topics');})->name('main');
