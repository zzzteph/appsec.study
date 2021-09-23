<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLabLessonQuestionAnswersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('lab_lesson_question_answers', function (Blueprint $table) {
            $table->id();
			$table->foreignId('lab_lesson_question_id') ->constrained()      ->onUpdate('cascade')      ->onDelete('cascade');
			$table->string('answer',100);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('lab_lesson_question_answers');
    }
}
