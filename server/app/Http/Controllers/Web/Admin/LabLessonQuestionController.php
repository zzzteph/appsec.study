<?php

namespace App\Http\Controllers\Web\Admin;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Course;
use App\Models\Topic;
use App\Models\Lesson;
use App\Models\LabLesson;
use App\Models\LabLessonQuestion;
use App\Models\UserLesson;
use App\Models\UserLabLessonQuestion;
use Illuminate\Support\Facades\Storage;
class LabLessonQuestionController extends Controller
{
	
	
	public function list($id)
    {

		return view('admin.content.lessons.lab.question.list',['lesson' =>LabLesson::where('lesson_id', $id)->firstOrFail()]);

	
    }
	
	public function new($id)
    {
		return view('admin.content.lessons.lab.question.new',['lesson' =>LabLesson::where('lesson_id', $id)->firstOrFail()]);

	
    }

	public function create(Request $request,$id)
	{
		
		$validated = $request->validate([
			'question' => 'required',
			'answer' => 'required',
			'score' => 'required',
		]);
		$labLesson=LabLesson::where('lesson_id', $id)->firstOrFail();
		
		$question=new LabLessonQuestion; 
		$question->answer=$request->input('answer');
		$question->question=$request->input('question');
		$question->score=intval($request->input('score'));
		$question->type='string';
		
		$labLesson->questions()->save($question);

		return redirect()->route('admin-list-lab-lesson-questions',['id' =>$id]);
	}
	
	
	
	

	public function edit($id,$question_id)
    {
		return view('admin.content.lessons.lab.question.edit',['lesson' =>LabLesson::where('lesson_id', $id)->firstOrFail(),'question' =>LabLessonQuestion::findOrFail($question_id)]);
    }

	public function decrease($id,$question_id)
	{
		LabLesson::where('lesson_id', $id)->firstOrFail();
		$question=LabLessonQuestion::findOrFail($question_id);
		if($question->order>0)
		$question->order=$question->order-1;
		
		$question->save();
		return redirect()->route('admin-list-lab-lesson-questions', ['id' =>$id]);
	}

	
	public function increase($id,$question_id)
	{
		LabLesson::where('lesson_id', $id)->firstOrFail();
		$question=LabLessonQuestion::findOrFail($question_id);
		$question->order=$question->order+1;
		
		$question->save();
		return redirect()->route('admin-list-lab-lesson-questions', ['id' =>$id]);
	}

	
	
	public function delete(Request $request,$id,$question_id)
	{	

		 LabLessonQuestion::where('id', $question_id)->delete();
		return redirect()->route('admin-list-lab-lesson-questions', ['id' =>$id]);
	}


	public function update(Request $request,$id,$question_id)
	{
		$question=LabLessonQuestion::findOrFail($question_id);
		$validated = $request->validate([
			'question' => 'required',
			'answer' => 'required',
			'score' => 'required',
		]);

		$question->answer=$request->input('answer');
		$question->question=$request->input('question');
		$question->score=intval($request->input('score'));
		$question->type='string';
		
		$question->save();

		return redirect()->route('admin-list-lab-lesson-questions', ['id' =>$id]);

	}
	

}
	
	
	
	
	
	

