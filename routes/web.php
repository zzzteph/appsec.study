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
use App\Http\Controllers\Web\CloudController;
use App\Http\Controllers\Web\UsersAdminController;
use App\Http\Controllers\Web\VmsController;
use App\Http\Controllers\Web\TaskController;
use App\Http\Controllers\Web\StatisticsController;
use App\Http\Controllers\Web\UsersController;
use App\Http\Controllers\Web\UserVmsController;

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

	Route::get('/courses/new',[CoursesController::class, 'new'])->name('new-course');
	Route::get('/courses/{course_id}',[CoursesController::class, 'edit'])->name('edit-course');
	Route::post('/courses', [CoursesController::class, 'create'])->name('add-new-course');
	Route::put('/courses/{course_id}', [CoursesController::class, 'update'])->name('update-course');
	Route::delete('/courses/{course_id}', [CoursesController::class, 'delete'])->name('delete-course');


	Route::get('/courses/{id}/topics', [TopicsController::class, 'new'])->name('new-topic');
	Route::get('/courses/{course_id}/topics/{topic_id}',[TopicsController::class, 'edit'])->name('edit-topic');
	Route::post('/courses/{course_id}/topics', [TopicsController::class, 'create'])->name('add-new-topic');
	Route::put('/courses/{course_id}/topics/{topic_id}', [TopicsController::class, 'update'])->name('update-topic');
	Route::put('/courses/{course_id}/topics/{topic_id}/increase', [TopicsController::class, 'increase'])->name('update-topic-order-increase');
	Route::put('/courses/{course_id}/topics/{topic_id}/decrease', [TopicsController::class, 'decrease'])->name('update-topic-order-decrease');
	Route::delete('/courses/{course_id}/topics/{topic_id}', [TopicsController::class, 'delete'])->name('delete-topic');




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

	//general lessons 

	Route::put('/courses/{course_id}/topics/{topic_id}/lesson/{lesson_id}/increase', [LessonsController::class, 'increase'])->name('update-lesson-order-increase');
	Route::put('/courses/{course_id}/topics/{topic_id}/lesson/{lesson_id}/decrease', [LessonsController::class, 'decrease'])->name('update-lesson-order-decrease');
	Route::delete('/courses/{course_id}/topics/{topic_id}/lesson/{lesson_id}', [LessonsController::class, 'delete'])->name('delete-lesson');

	//admin theory lesson 
	Route::get('/courses/{course_id}/topics/{topic_id}/theory', [TheoryLessonController::class, 'new'])->name('new-theory-lesson');
	Route::get('/courses/{course_id}/topics/{topic_id}/theory/{lesson_id}',[TheoryLessonController::class, 'edit'])->name('edit-theory-lesson');
	Route::post('/courses/{course_id}/topics/{topic_id}/theory', [TheoryLessonController::class, 'create'])->name('add-new-theory-lesson');
	Route::put('/courses/{course_id}/topics/{topic_id}/theory/{lesson_id}', [TheoryLessonController::class, 'update'])->name('update-theory-lesson');

	//admin practice lesson
	Route::get('/courses/{course_id}/topics/{topic_id}/lab', [LabLessonController::class, 'new'])->name('new-lab-lesson');
	Route::get('/courses/{course_id}/topics/{topic_id}/lab/{lesson_id}',[LabLessonController::class, 'edit'])->name('edit-lab-lesson');
	Route::post('/courses/{course_id}/topics/{topic_id}/lab', [LabLessonController::class, 'create'])->name('add-new-lab-lesson');
	Route::put('/courses/{course_id}/topics/{topic_id}/lab/{lesson_id}', [LabLessonController::class, 'update'])->name('update-lab-lesson');

	//admin general delete
	Route::delete('/courses/{course_id}/topics/{topic_id}/lesson/{lesson_id}', [LessonsController::class, 'delete'])->name('delete-lesson');
	//admin edit questions
	Route::get('/courses/{course_id}/topics/{topic_id}/lab/{lesson_id}/questions', [LabLessonQuestionController::class, 'list'])->name('list-lab-lesson-questions');
	Route::get('/courses/{course_id}/topics/{topic_id}/lab/{lesson_id}/questions/new', [LabLessonQuestionController::class, 'new'])->name('new-lab-lesson-questions');
	Route::get('/courses/{course_id}/topics/{topic_id}/lab/{lesson_id}/questions/{question_id}', [LabLessonQuestionController::class, 'edit'])->name('edit-lab-lesson-questions');

	Route::post('/courses/{course_id}/topics/{topic_id}/lab/{lesson_id}/questions', [LabLessonQuestionController::class, 'create'])->name('create-lab-lesson-questions');

	Route::put('/courses/{course_id}/topics/{topic_id}/lab/{lesson_id}/questions/{question_id}', [LabLessonQuestionController::class, 'update'])->name('update-lab-lesson-questions');
	Route::delete('/courses/{course_id}/topics/{topic_id}/lab/{lesson_id}/questions/{question_id}', [LabLessonQuestionController::class, 'delete'])->name('delete-lab-lesson-questions');
	Route::put('/courses/{course_id}/topics/{topic_id}/lab/{lesson_id}/questions/{question_id}/inc', [LabLessonQuestionController::class, 'increase'])->name('inc-order-lab-lesson-questions');
	Route::put('/courses/{course_id}/topics/{topic_id}/lab/{lesson_id}/questions/{question_id}/dec', [LabLessonQuestionController::class, 'decrease'])->name('dec-order-lab-lesson-questions');


});

Route::middleware(['auth','verified'])->group(function () {
	Route::get('courses', [CoursesController::class, 'list'])->name('courses');

	Route::get('courses/{id}',[TopicsController::class, 'list'])->name('topics');
	Route::get('courses/{id}/topics',[TopicsController::class, 'list'])->name('topics');

	Route::get('courses/{course_id}/topics/{topic_id}', [LessonsController::class, 'list'])->name('lessons');
	Route::get('courses/{course_id}/topics/{topic_id}/lessons', [LessonsController::class, 'list'])->name('lessons');

	Route::get('courses/{course_id}/topics/{topic_id}/lessons/{lesson_id}', [LessonsController::class, 'view'])->name('view-lesson');

	//actions
	Route::put('courses/{course_id}/topics/{topic_id}/lessons/{lesson_id}/done', [TheoryLessonController::class, 'mark_as_done'])->name('mark-theory-as-read');
	Route::post('courses/{course_id}/topics/{topic_id}/lessons/{lesson_id}', [LabLessonQuestionController::class, 'answer'])->name('question-answer');

	//tasks
	Route::post('/task/{lesson_id}', [TaskController::class, 'start'])->name('start-task');
	Route::delete('/task/{lesson_id}', [TaskController::class, 'stop'])->name('stop-task');


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
