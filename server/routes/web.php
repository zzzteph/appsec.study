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
use App\Http\Controllers\Web\CloudController;
use App\Http\Controllers\Web\UsersAdminController;
use App\Http\Controllers\Web\VmsController;
use App\Http\Controllers\Web\TaskController;
use App\Http\Controllers\Web\StatisticsController;
use App\Http\Controllers\Web\UsersController;
use App\Http\Controllers\Web\UserVmsController;


 
use App\Http\Controllers\Web\Admin\CoursesController as AdminCourse;
use App\Http\Controllers\Web\Admin\TopicsController as AdminTopics;
use App\Http\Controllers\Web\Admin\NodesController as AdminNodes;
use App\Http\Controllers\Web\Admin\LessonsController as AdminLesson;
use App\Http\Controllers\Web\Admin\TheoryLessonController as AdminTheory;
use App\Http\Controllers\Web\Admin\LabLessonController as AdminLabLesson;
use App\Http\Controllers\Web\Admin\LabLessonQuestionController as AdminLessonLabLessonQuestion;

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

    Route::get('/courses',[AdminCourse::class, 'list'])->name('admin-view-courses');
	Route::get('/courses/new',[AdminCourse::class, 'new'])->name('admin-new-course');
	Route::get('/courses/{id}',[AdminCourse::class, 'edit'])->name('admin-edit-course');
	Route::post('/courses', [AdminCourse::class, 'create'])->name('admin-add-new-course');
	Route::put('/courses/{id}', [AdminCourse::class, 'update'])->name('admin-update-course');
	Route::delete('/courses/{id}', [AdminCourse::class, 'delete'])->name('admin-delete-course');


	Route::get('/courses/{course_id}/topics', [AdminTopics::class, 'list'])->name('admin-list-topics');
	Route::get('/courses/{course_id}/topics/new', [AdminTopics::class, 'new'])->name('admin-new-topic');
	Route::get('/courses/{course_id}/topics/{topic_id}',[AdminTopics::class, 'edit'])->name('admin-edit-topic');
	Route::post('/courses/{course_id}/topics', [AdminTopics::class, 'create'])->name('admin-add-new-topic');
	Route::put('/courses/{course_id}/topics/{topic_id}', [AdminTopics::class, 'update'])->name('admin-update-topic');
	Route::put('/courses/{course_id}/topics/{topic_id}/increase', [AdminTopics::class, 'increase'])->name('admin-update-topic-order-increase');
	Route::put('/courses/{course_id}/topics/{topic_id}/decrease', [AdminTopics::class, 'decrease'])->name('admin-update-topic-order-decrease');
	Route::delete('/courses/{course_id}/topics/{topic_id}', [AdminTopics::class, 'delete'])->name('admin-delete-topic');



	//node controller
	
	Route::get('courses/{course_id}/topics/{topic_id}/lessons', [AdminNodes::class, 'get'])->name('admin-nodes');
	Route::put('courses/{course_id}/topics/{topic_id}/lessons', [AdminNodes::class, 'update'])->name('admin-nodes-update');



	//cloud routes
	Route::get('/cloud', [CloudController::class, 'get'])->name('cloud');
	Route::post('/cloud', [CloudController::class, 'create'])->name('create-cloud');
	Route::put('/cloud', [CloudController::class, 'update'])->name('update-cloud');


	//admin cloud-tasks monitor
	Route::get('/cloud/tasks', [CloudController::class, 'monitor'])->name('monitor-task');
	Route::put('/cloud/tasks/{task_id}', [CloudController::class, 'update_cloud_task'])->name('update-cloud-task');




	//vms updates
	Route::get('/vms', [VmsController::class, 'get'])->name('vms');
	Route::post('/vms', [VmsController::class, 'create'])->name('create-vms');
	Route::put('/vms/{id}', [VmsController::class, 'update'])->name('update-vms');
	Route::delete('/vms/{id}', [VmsController::class, 'delete'])->name('delete-vms');

	//userVMS management

	Route::get('/user/vms', [UserVmsController::class, 'admin_get'])->name('admin-user-vms');
	Route::post('/user/vms', [UserVmsController::class, 'create'])->name('admin-create-user-vms');
	Route::put('/user/vms', [UserVmsController::class, 'update'])->name('admin-update-user-vms');
	Route::delete('/user/vms', [UserVmsController::class, 'delete'])->name('admin-delete-user-vms');



	//users
	Route::get('/user', [UsersAdminController::class, 'get'])->name('users');
	Route::post('/user', [UsersAdminController::class, 'create'])->name('create-user');
	Route::put('/user/{id}', [UsersAdminController::class, 'update'])->name('update-user');
	Route::put('/user/{id}/reset', [UsersAdminController::class, 'reset'])->name('reset-user');
	Route::delete('/user/{id}', [UsersAdminController::class, 'delete'])->name('delete-user');

	//general lessons administration
	
	Route::get('lessons', [AdminLesson::class, 'list'])->name('admin-view-lessons');
	Route::get('lessons/{id}', [AdminLesson::class, 'view'])->name('admin-view-lesson');
	Route::delete('lessons/{id}', [AdminLesson::class, 'delete'])->name('admin-delete-lesson');


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




	//admin general delete
	Route::delete('/courses/{course_id}/topics/{topic_id}/lesson/{lesson_id}', [LessonsController::class, 'delete'])->name('delete-lesson');
	
	
	
	//admin edit questions
	Route::get('lessons/lab/{id}/questions', [AdminLessonLabLessonQuestion::class, 'list'])->name('admin-list-lab-lesson-questions');
	Route::get('lessons/lab/{id}/questions/new', [AdminLessonLabLessonQuestion::class, 'new'])->name('admin-new-lab-lesson-questions');
	Route::get('lessons/lab/{id}/questions/{question_id}', [AdminLessonLabLessonQuestion::class, 'edit'])->name('admin-edit-lab-lesson-questions');

	Route::post('lessons/lab/{id}/questions', [AdminLessonLabLessonQuestion::class, 'create'])->name('admin-create-lab-lesson-questions');

	Route::put('lessons/lab/{id}/questions/{question_id}', [AdminLessonLabLessonQuestion::class, 'update'])->name('admin-update-lab-lesson-questions');
	Route::delete('lessons/lab/{id}/questions/{question_id}', [AdminLessonLabLessonQuestion::class, 'delete'])->name('admin-delete-lab-lesson-questions');
	Route::put('lessons/lab/{id}/questions/{question_id}/inc', [AdminLessonLabLessonQuestion::class, 'increase'])->name('admin-inc-order-lab-lesson-questions');
	Route::put('lessons/lab/{id}/questions/{question_id}/dec', [AdminLessonLabLessonQuestion::class, 'decrease'])->name('admin-dec-order-lab-lesson-questions');


});

Route::middleware(['auth','verified'])->group(function () {
	Route::get('courses', [CoursesController::class, 'list'])->name('courses');
	Route::get('courses/{id}',[TopicsController::class, 'list'])->name('topics');
	Route::get('courses/{id}/topics',[TopicsController::class, 'list'])->name('topics');
	Route::get('courses/{course_id}/topics/{topic_id}', [NodesController::class, 'list'])->name('lessons');
	
	Route::get('courses/{course_id}/topics/{topic_id}/lessons', [NodesController::class, 'list'])->name('lessons');

	Route::get('courses/{course_id}/topics/{topic_id}/lessons/{node_id}', [NodesController::class, 'view'])->name('view-lesson');
	
//actions
	Route::put('courses/{course_id}/topics/{topic_id}/lessons/{lesson_id}/done', [TheoryLessonController::class, 'mark_as_done'])->name('mark-theory-as-read');
	Route::post('courses/{course_id}/topics/{topic_id}/lessons/{node_id}', [LabLessonQuestionController::class, 'answer'])->name('question-answer');
	//tasks
	Route::post('/task/{node_id}', [TaskController::class, 'start'])->name('start-task');
	Route::delete('/task/{node_id}', [TaskController::class, 'stop'])->name('stop-task');
	//user vms

	Route::post('/tools', [TaskController::class, 'tools_start'])->name('user-vm-start');
	Route::delete('/tools', [TaskController::class, 'tools_stop'])->name('user-vm-stop');
	//user pages
	Route::get('users/{id}/edit',[UsersController::class, 'edit'])->name('edit-user-page');
	Route::put('users/{id}',[UsersController::class, 'update'])->name('update-user-page');

});

Route::get('users/{id}',[UsersController::class, 'get'])->name('user-page');
Route::get('rating', [StatisticsController::class, 'rating'])->name('rating');

Route::get('login', function () {    return view('auth.login');})->name('login');
Route::get('register', function () {    return view('auth.register');})->name('register');
Route::post('login', [AuthController::class, 'authentificate']);
Route::post('register', [AuthController::class, 'register']);
Route::delete('logout', [AuthController::class, 'logout'])->name('logout');


Route::get('/auth/{driver}/redirect', function (Request $request, $driver) {
    return Socialite::driver($driver)->redirect();
});


Route::get('/auth/{driver}/callback',[AuthController::class, 'social_login']);

Route::get('/forgot-password', function () {
    return view('auth.forgot-password');
})->name('password.request');

Route::post('/forgot-password', function (Request $request) {
    $request->validate(['email' => 'required|email']);

    $status = Password::sendResetLink(
        $request->only('email')
    );

    return $status === Password::RESET_LINK_SENT
                ? back()->with(['success' => __($status)])
                : back()->withErrors(['email' => __($status)]);
})->name('password.email');

Route::get('/reset-password/{token}', function ($token) {
    return view('auth.reset-password', ['token' => $token]);
})->name('password.reset');


Route::post('/reset-password', function (Request $request) {
    $request->validate([
        'token' => 'required',
        'email' => 'required|email',
        'password' => 'required|min:8|confirmed',
    ]);

    $status = Password::reset(
        $request->only('email', 'password', 'password_confirmation', 'token'),
        function ($user, $password) use ($request) {
            $user->forceFill([
                'password' => Hash::make($password)
            ])->setRememberToken(Str::random(60));

            $user->save();

            event(new PasswordReset($user));
        }
    );

    return $status == Password::PASSWORD_RESET
                ? redirect()->route('login')->with('success', __($status))
                : back()->withErrors(['email' => [__($status)]]);
})->name('password.update');



Route::get('/email/verify/{id}/{hash}',[VerifyController::class, 'verify'])->name('verification.verify');
Route::get('/email/verify', function () {    return view('auth.verify-email');})->middleware('auth')->name('verification.notice');
Route::post('/email/verification-notification', function (Request $request) {
    $request->user()->sendEmailVerificationNotification();
    return back()->with('success', 'Verification link sent!');
})->middleware(['auth', 'throttle:6,1'])->name('verification.send');


Route::get('/', function () {   return redirect()->route('courses');})->name('main');
