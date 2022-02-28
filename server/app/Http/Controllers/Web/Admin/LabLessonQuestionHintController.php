<?php

namespace App\Http\Controllers\Web\Admin;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Topic;
use App\Models\Lesson;
use App\Models\LabLesson;
use App\Models\LabLessonQuestion;
use App\Models\LabLessonQuestionHint;
class LabLessonQuestionHintController extends Controller
{
	
	
	public function list($question_id)
    {

		return view('admin.content.lessons.lab.question.hint.list',['question' =>LabLessonQuestion::where('id', $question_id)->firstOrFail()]);
    }
	
	public function new($question_id)
    {
		return view('admin.content.lessons.lab.question.hint.new',['question' =>LabLessonQuestion::where('id', $question_id)->firstOrFail()]);
    }

	public function create(Request $request,$question_id)
	{
		
		$validated = $request->validate([
			'hint' => 'required',
			'price' => 'required',
		]);
		$labLessonQuestion=LabLessonQuestion::where('id', $question_id)->firstOrFail();
		
		$hint=new LabLessonQuestionHint; 
	
		$hint->hint=$request->input('hint');
		$hint->price=intval($request->input('price'));
		$labLessonQuestion->hints()->save($hint);



		return redirect()->route('admin-list-lab-lesson-question-hints',['question_id' =>$question_id]);
	}
	
	
	
	

	public function edit($question_id,$hint_id)
    {

		return view('admin.content.lessons.lab.question.hint.edit',[
		'question' =>LabLessonQuestion::findOrFail($question_id),
		'hint' =>LabLessonQuestionHint::findOrFail($hint_id)]);
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

	
	
	public function delete(Request $request,$question_id,$hint_id)
	{	

		 LabLessonQuestionHint::where('id', $hint_id)->delete();
		return redirect()->route('admin-list-lab-lesson-question-hints',['question_id' =>$question_id]);
	}


	public function update(Request $request,$question_id,$hint_id)
	{
		$question=LabLessonQuestion::findOrFail($question_id);
		$hint=LabLessonQuestionHint::findOrFail($hint_id);
		$validated = $request->validate([
			'hint' => 'required',
			'price' => 'required',
		]);
		$hint->hint=$request->input('hint');
		$hint->price=intval($request->input('price'));
		$hint->save();
	


	
	return redirect()->route('admin-list-lab-lesson-question-hints',['question_id' =>$question_id]);
	}
	

}
	
	
	
	
	
	

